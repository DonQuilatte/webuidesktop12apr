use std::process::{Child, Command};
use std::sync::{Mutex};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Wry};
use sysinfo::System;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use futures::stream::StreamExt;
use reqwest;

const APP_NAME: &str = "OpenWebUIOnboarding";
const APP_AUTHOR: &str = "OpenWebUI";

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Preferences {
    telemetry: bool,
    theme: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct TelemetryEvent {
    event: String,
    details: HashMap<String, serde_json::Value>,
    timestamp: String,
}

#[derive(Debug, Clone, Serialize, Default)]
enum DownloadStatus {
    #[default]
    Idle,
    Downloading,
    Completed,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Default)]
struct DownloadState {
    status: DownloadStatus,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
}

struct AppState {
    download_state: std::sync::Arc<Mutex<DownloadState>>,
}

fn get_app_data_dir(app_handle: &AppHandle<Wry>) -> Result<PathBuf, String> {
    app_handle.path().app_local_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

fn get_app_log_dir(app_handle: &AppHandle<Wry>) -> Result<PathBuf, String> {
    app_handle.path().app_log_dir()
        .map_err(|e| format!("Failed to get app log dir: {}", e))
}

#[tauri::command]
fn get_preferences(app_handle: AppHandle<Wry>) -> Result<serde_json::Value, String> {
    let path = get_app_data_dir(&app_handle)?.join("preferences.json");
    
    if !path.exists() {
        return Ok(serde_json::json!({
            "preferences": {
                "telemetry": false,
                "theme": "light"
            }
        }));
    }
    
    match fs::read_to_string(&path) {
        Ok(content) => {
            match serde_json::from_str::<Preferences>(&content) {
                Ok(prefs) => Ok(serde_json::json!({ "preferences": prefs })),
                Err(e) => {
                    eprintln!("Error parsing preferences: {:?}", e);
                    Ok(serde_json::json!({
                        "preferences": {
                            "telemetry": false,
                            "theme": "light"
                        }
                    }))
                }
            }
        },
        Err(e) => {
            eprintln!("Error reading preferences file: {:?}", e);
            Ok(serde_json::json!({
                "preferences": {
                    "telemetry": false,
                    "theme": "light"
                }
            }))
        }
    }
}

#[tauri::command]
fn save_preferences(app_handle: AppHandle<Wry>, preferences: Preferences) -> Result<serde_json::Value, String> {
    let path = get_app_data_dir(&app_handle)?.join("preferences.json");
    
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }
    }
    
    let json = serde_json::to_string_pretty(&preferences)
        .map_err(|e| format!("Failed to serialize preferences: {}", e))?;
    
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write preferences: {}", e))?;
    
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn save_onboarding_data(app_handle: AppHandle<Wry>, data: Preferences) -> Result<serde_json::Value, String> {
    let path = get_app_data_dir(&app_handle)?.join("onboarding_complete.json");
    
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }
    }
    
    let completion_data = serde_json::json!({
        "completed": true,
        "timestamp": Utc::now().to_rfc3339(),
        "preferences": data
    });
    
    let json = serde_json::to_string_pretty(&completion_data)
        .map_err(|e| format!("Failed to serialize onboarding data: {}", e))?;
    
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write onboarding data: {}", e))?;
    
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn store_telemetry_event(app_handle: AppHandle<Wry>, event: String, details: HashMap<String, serde_json::Value>) -> Result<serde_json::Value, String> {
    let path = get_app_log_dir(&app_handle)?.join("telemetry.log");
    
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directories: {}", e))?;
        }
    }
    
    let telemetry_event = TelemetryEvent {
        event,
        details,
        timestamp: Utc::now().to_rfc3339(),
    };
    
    let json = serde_json::to_string(&telemetry_event)
        .map_err(|e| format!("Failed to serialize telemetry event: {}", e))?;
    
    let content = format!("{}\n", json);
    
    let result = if path.exists() {
        fs::OpenOptions::new()
            .append(true)
            .open(&path)
            .and_then(|mut file| std::io::Write::write_all(&mut file, content.as_bytes()))
    } else {
        fs::write(&path, content)
    };
    
    result.map_err(|e| format!("Failed to store telemetry event: {}", e))?;
    
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn get_os_info() -> String {
  format!("{} {}", std::env::consts::OS, std::env::consts::ARCH)
}

#[tauri::command]
fn get_disk_space() -> (u64, u64) {
  // Return dummy values: 100GB free, 500GB total
  (100 * 1024 * 1024 * 1024, 500 * 1024 * 1024 * 1024)
}

#[tauri::command]
fn get_memory_info() -> (u64, u64) {
  let mut sys = System::new_all();
  sys.refresh_memory(); // Use specific refresh
  (sys.available_memory(), sys.total_memory())
}

#[tauri::command]
async fn check_network_status() -> bool {
  // Attempt to resolve a known reliable host
  match tokio::net::lookup_host("google.com:80").await {
    Ok(_) => true,
    Err(_) => false,
  }
}

struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
async fn start_backend_download(app_handle: AppHandle, state: tauri::State<'_, AppState>) -> Result<(), String> {
    log::info!("Attempting to start backend download...");
    
    let download_url = "https://github.com/9apropenwebui/models/releases/download/latest/ggml-gpt4all-j-v1.3-groovy.bin"; // Example URL
    let mut target_file_path = match app_handle.path().app_local_data_dir() { // Returns Result<PathBuf, Error>
        Ok(dir) => dir, // Use Ok() for success case
        Err(e) => return Err(format!("Could not get app local data directory: {}", e).into()), // Use Err() for error case
    };
    if !target_file_path.exists() {
        fs::create_dir_all(&target_file_path).map_err(|e| format!("Failed to create data dir: {}", e))?;
    }
    target_file_path.push("backend_model.bin"); // Example filename
    
    log::info!("Target download path: {}", target_file_path.display());
    
    let state_clone = std::sync::Arc::clone(&state.download_state);
    
    // Update state immediately to Downloading
    {
        let mut state_lock = state_clone.lock().unwrap();
        *state_lock = DownloadState {
            status: DownloadStatus::Downloading,
            downloaded_bytes: 0,
            total_bytes: None, // Will be set once response headers are received
        };
    }
    
    // Spawn the download task
    tokio::spawn(async move {
        log::info!("Download task started for URL: {}", download_url);
        match download_file(download_url, target_file_path, state_clone.clone()).await {
            Ok(_) => {
                log::info!("Download task completed successfully.");
                let mut state_lock = state_clone.lock().unwrap();
                state_lock.status = DownloadStatus::Completed;
            }
            Err(e) => {
                log::error!("Download task failed: {}", e);
                let mut state_lock = state_clone.lock().unwrap();
                state_lock.status = DownloadStatus::Error(e.to_string());
            }
        }
    });
    
    Ok(())
}

#[tauri::command]
fn check_backend_download_progress(state: tauri::State<'_, AppState>) -> Result<u8, String> {
    let state_lock = state.download_state.lock().unwrap();
    match state_lock.status {
        DownloadStatus::Idle => Ok(0),
        DownloadStatus::Downloading => {
            let downloaded = state_lock.downloaded_bytes;
            let total = state_lock.total_bytes;
            if let Some(total) = total {
                if total == 0 { Ok(0) }
                else { Ok(((downloaded * 100) / total) as u8) }
            }
            else { Ok(0) } // Return 0 if total size isn't known yet
        }
        DownloadStatus::Completed => Ok(100),
        DownloadStatus::Error(_) => Ok(0), // Or maybe a specific error code?
    }
}

// Helper function for the actual download logic
async fn download_file(url: &str, path: PathBuf, state: std::sync::Arc<Mutex<DownloadState>>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();
    let response = client.get(url).send().await?.error_for_status()?; // Ensure we check for HTTP errors
    
    let total_size = response.content_length();
    {
        let mut state_lock = state.lock().unwrap();
        state_lock.total_bytes = total_size;
        if total_size.is_none() {
             log::warn!("Content-Length header not found. Progress percentage may be inaccurate.");
        }
    }
    
    let mut file = File::create(&path).await?;
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    
    while let Some(item) = stream.next().await {
        let chunk = item?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;
        {
            let mut state_lock = state.lock().unwrap();
            state_lock.downloaded_bytes = downloaded;
            // Optional: Add throttling here if state updates are too frequent
        }
    }
    log::info!("Finished writing to file: {}", path.display());
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      get_os_info,
      get_disk_space,
      get_memory_info,
      check_network_status,
      get_preferences,
      save_preferences,
      save_onboarding_data,
      store_telemetry_event,
      start_backend_download,
      check_backend_download_progress
    ])
    .manage(BackendProcess(Mutex::new(None)))
    .setup(|app| {
      let backend_state = app.state::<BackendProcess>();
      
      let current_dir_debug = std::env::current_dir();
      println!("Tauri setup current_dir: {:?}", current_dir_debug);
      
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Add the download state management
      let initial_state = AppState { download_state: std::sync::Arc::new(Mutex::new(DownloadState::default())) };
      app.manage(initial_state);
      
      // Spawn backend Python process
      let project_root = std::env::current_dir()
        .map_err(|e| format!("Failed to get current dir: {:?}", e))
        .and_then(|dir| dir.parent().ok_or_else(|| "Failed to get parent dir (1)".to_string()).map(|p| p.to_path_buf()))
        .and_then(|dir| dir.parent().ok_or_else(|| "Failed to get parent dir (2)".to_string()).map(|p| p.to_path_buf()));
      
      println!("Calculated project_root: {:?}", project_root);
      
      let backend_path = project_root.as_ref()
          .map(|root| root.join("backend").join("main.py"))
          .map_err(|e| format!("Failed to get project root: {:?}", e));
      
      #[cfg(unix)]
      let python_executable = project_root.as_ref()
          .map(|root| root.join(".venv").join("bin").join("python"))
          .map_err(|e| format!("Failed to get project root for python: {:?}", e));
      
      #[cfg(windows)]
      let python_executable = project_root.as_ref()
          .map(|root| root.join(".venv").join("Scripts").join("python.exe"))
          .map_err(|e| format!("Failed to get project root for python: {:?}", e));
      
      println!("Resolved python_executable: {:?}", python_executable);
      println!("Resolved backend_path: {:?}", backend_path);
      
      let result = match (backend_path, python_executable) {
        (Ok(backend_path), Ok(python_executable)) => {
          if !python_executable.exists() {
            eprintln!("Error: Python executable not found at {:?}. Make sure the .venv exists and is correctly structured.", python_executable);
            if let Ok(proj_root) = &project_root {
                let venv_path_check = proj_root.join(".venv");
                println!("Checking for .venv at: {:?}", venv_path_check);
                println!(".venv exists: {}", venv_path_check.exists());
            }
            return Ok(());
          }
          // Get the directory of the backend script
          let backend_dir = backend_path.parent().ok_or_else(|| "Failed to get backend directory".to_string())?;
          println!("Setting backend process CWD to: {:?}", backend_dir); // Debug CWD
          
          Command::new(python_executable)
            .arg(&backend_path) // Pass the full path as arg
            .current_dir(backend_dir) // Set CWD to the backend folder
            .spawn()
        }
        (Err(e), _) => {
          eprintln!("Failed to resolve backend path: {}", e);
          return Ok(());
        }
        (_, Err(e)) => {
          eprintln!("Failed to resolve python executable path: {}", e);
          return Ok(());
        }
      };
      
      match result {
        Ok(child) => {
          println!("Backend process started successfully");
          *backend_state.0.lock().unwrap() = Some(child);
        }
        Err(e) => {
          eprintln!("Failed to start backend process: {:?}", e);
        }
      }
      
      Ok(())
    })
    .on_window_event(|window, event| { 
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        let backend_state = window.state::<BackendProcess>(); 
        let mut lock = backend_state.0.lock().unwrap();
        if let Some(child) = lock.as_mut() {
          let _ = child.kill();
          println!("Backend process killed on app close");
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
