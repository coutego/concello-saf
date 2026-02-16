#![windows_subsystem = "windows"]

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

mod backup;
mod commands;
mod database;
mod excel;
mod lock;
mod models;

use database::Database;
use lock::FileLock;

pub struct AppState {
    pub db: Mutex<Database>,
    pub lock: Mutex<Option<FileLock>>,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            // Get or create database path
            let db_path = get_db_path(&app_handle);

            // Initialize file lock
            let lock_path = db_path.with_extension("lock");
            let file_lock = FileLock::new(&lock_path)?;

            // Initialize database
            let db = Database::new(&db_path)?;

            // Store in app state
            app.manage(AppState {
                db: Mutex::new(db),
                lock: Mutex::new(Some(file_lock)),
            });

            // Get main window and setup cleanup on close
            let main_window = app.get_window("main").unwrap();
            let app_handle_clone = app_handle.clone();

            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // Cleanup: release file lock
                    if let Some(state) = app_handle_clone.try_state::<AppState>() {
                        if let Ok(mut lock_guard) = state.lock.lock() {
                            // Drop the FileLock explicitly - this will unlock and delete the .lock file
                            *lock_guard = None;
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // User commands
            commands::get_users,
            commands::create_user,
            commands::update_user,
            commands::delete_user,
            commands::search_users,
            // Item commands
            commands::get_items,
            commands::get_default_items,
            commands::add_default_items,
            commands::create_item,
            commands::update_item_stock,
            commands::search_items,
            commands::delete_item,
            // Loan commands
            commands::get_loans,
            commands::get_loan_by_id,
            commands::create_loan,
            commands::return_loan,
            commands::cancel_return,
            commands::get_active_loans,
            commands::get_overdue_loans,
            // Dashboard
            commands::get_dashboard_stats,
            // Events
            commands::get_events,
            commands::get_events_by_loan,
            // Excel export
            commands::export_to_excel,
            commands::export_annual_report,
            commands::export_annual_report_pdf,
            // Backup
            commands::create_backup,
            commands::restore_backup,
            commands::get_backup_list,
            commands::export_backup,
            commands::import_backup,
            commands::delete_backup,
            // Settings
            commands::get_db_location,
            commands::set_db_location,
            commands::has_db_location_configured,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    // Try to load from settings first
    let settings_path = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("settings.json");

    if let Ok(content) = std::fs::read_to_string(&settings_path) {
        if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(path_str) = settings.get("db_path").and_then(|v| v.as_str()) {
                return PathBuf::from(path_str);
            }
        }
    }

    // Default location: app data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."));

    // Create the directory if it doesn't exist
    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
    }

    app_data_dir.join("saf_database.db")
}
