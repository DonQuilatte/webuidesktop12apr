use std::process::{Child, Command};
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use sysinfo::System;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;

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

fn get_preferences_path() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).join("preferences.json")
}

fn get_telemetry_path() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).join("telemetry.log")
}

fn get_onboarding_path() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).join("onboarding_complete.json")
}

#[tauri::command]
fn get_preferences() -> Result<serde_json::Value, String> {
    let path = get_preferences_path();
    
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
fn save_preferences(preferences: Preferences) -> Result<serde_json::Value, String> {
    let path = get_preferences_path();
    
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
fn save_onboarding_data(data: Preferences) -> Result<serde_json::Value, String> {
    let path = get_onboarding_path();
    
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
fn store_telemetry_event(event: String, details: HashMap<String, serde_json::Value>) -> Result<serde_json::Value, String> {
    let path = get_telemetry_path();
    
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
      store_telemetry_event
    ])
    .manage(BackendProcess(Mutex::new(None)))
    .setup(|app| {
      let backend_state = app.state::<BackendProcess>();

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Spawn backend Python process
      let backend_path = std::env::current_dir()
        .map(|dir| dir
          .parent().unwrap_or(&dir)
          .parent().unwrap_or(&dir)
          .join("backend")
          .join("main.py"));

      let result = match backend_path {
        Ok(path) => Command::new("python3")
          .arg(path)
          .spawn(),
        Err(e) => {
          eprintln!("Failed to resolve backend path: {:?}", e);
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
