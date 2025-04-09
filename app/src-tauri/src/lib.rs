use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager; // Import the Manager trait
use sysinfo::System; // Only System is needed now

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
      check_network_status // Add the new command
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
    .on_window_event(|window, event| { // Update closure signature
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        let backend_state = window.state::<BackendProcess>(); // Use window.state()
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
