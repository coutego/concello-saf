use crate::models::*;
use crate::AppState;
use tauri::State;

// User commands
#[tauri::command]
pub fn get_users(state: State<AppState>) -> Result<Vec<User>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_users()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_user(req: CreateUserRequest, state: State<AppState>) -> Result<User, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .create_user(req)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_user(
    id: String,
    req: UpdateUserRequest,
    state: State<AppState>,
) -> Result<User, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .update_user(&id, req)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_user(id: String, state: State<AppState>) -> Result<(), String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .delete_user(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_users(query: String, state: State<AppState>) -> Result<Vec<User>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .search_users(&query)
        .map_err(|e| e.to_string())
}

// Item commands
#[tauri::command]
pub fn get_items(state: State<AppState>) -> Result<Vec<Item>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_items()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_default_items() -> Result<Vec<serde_json::Value>, String> {
    // Devolver a lista de artigos por defecto sen engadilos á BD
    let items: Vec<serde_json::Value> = crate::database::DEFAULT_ITEMS
        .iter()
        .map(|(name, desc, category, icon)| {
            serde_json::json!({
                "name": name,
                "description": desc,
                "category": category,
                "icon": icon
            })
        })
        .collect();
    Ok(items)
}

#[tauri::command]
pub fn add_default_items(state: State<AppState>) -> Result<Vec<Item>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .add_default_items()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_item(req: CreateItemRequest, state: State<AppState>) -> Result<Item, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .create_item(req)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_item_stock(
    item_id: String,
    new_total_stock: i32,
    state: State<AppState>,
) -> Result<Item, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .update_item_stock(&item_id, new_total_stock)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_items(query: String, state: State<AppState>) -> Result<Vec<Item>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .search_items(&query)
        .map_err(|e| e.to_string())
}

// Loan commands
#[tauri::command]
pub fn get_loans(state: State<AppState>) -> Result<Vec<Loan>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_loans()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_loan_by_id(id: String, state: State<AppState>) -> Result<Loan, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_loan_by_id(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_loan(req: CreateLoanRequest, state: State<AppState>) -> Result<Loan, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .create_loan(req)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn return_loan(
    id: String,
    condition: Option<String>,
    notes: Option<String>,
    state: State<AppState>,
) -> Result<Loan, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .return_loan(&id, condition, notes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cancel_return(
    loan_id: String,
    reason: Option<String>,
    state: State<AppState>,
) -> Result<Loan, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .cancel_return(&loan_id, reason)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_active_loans(state: State<AppState>) -> Result<Vec<Loan>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    // Implementation to filter active loans
    let loans = state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_loans()
        .map_err(|e| e.to_string())?;
    Ok(loans
        .into_iter()
        .filter(|l| matches!(l.status, LoanStatus::Active))
        .collect())
}

#[tauri::command]
pub fn get_overdue_loans(state: State<AppState>) -> Result<Vec<Loan>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    // Implementation to filter overdue loans
    let loans = state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_loans()
        .map_err(|e| e.to_string())?;
    Ok(loans
        .into_iter()
        .filter(|l| matches!(l.status, LoanStatus::Overdue))
        .collect())
}

// Dashboard
#[tauri::command]
pub fn get_dashboard_stats(state: State<AppState>) -> Result<DashboardStats, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    // Update overdue loans first
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .update_overdue_loans()
        .map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_dashboard_stats()
        .map_err(|e| e.to_string())
}

// Events
#[tauri::command]
pub fn get_events(limit: i64, state: State<AppState>) -> Result<Vec<Event>, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    state
        .db
        .lock()
        .map_err(|e| e.to_string())?
        .get_events(limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_events_by_loan(_loan_id: String, _state: State<AppState>) -> Result<Vec<Event>, String> {
    // Implementation to get events by loan
    Err("Not implemented".to_string())
}

// Settings
#[tauri::command]
pub fn get_db_location(app_handle: tauri::AppHandle) -> Result<String, String> {
    use std::path::PathBuf;

    let settings_path = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("settings.json");

    if let Ok(content) = std::fs::read_to_string(&settings_path) {
        if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(path) = settings.get("db_path").and_then(|v| v.as_str()) {
                return Ok(path.to_string());
            }
        }
    }

    // Default location
    let default_path = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("saf_database.db");

    Ok(default_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn set_db_location(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use std::path::PathBuf;

    let settings_path = app_handle
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("settings.json");

    let settings = serde_json::json!({
        "db_path": path
    });

    std::fs::write(&settings_path, settings.to_string()).map_err(|e| e.to_string())
}

// Excel export
#[tauri::command]
pub fn export_to_excel(path: String, state: State<AppState>) -> Result<(), String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::excel::export_loans_to_excel(&*db, &path).map_err(|e| e.to_string())
}

// Backup
#[tauri::command]
pub fn create_backup(
    backup_dir: String,
    app_handle: tauri::AppHandle,
    state: State<AppState>,
) -> Result<BackupInfo, String> {
    let _lock = state.lock.lock().map_err(|e| e.to_string())?;
    let db_path = get_db_location(app_handle)?;
    crate::backup::create_backup(&db_path, &backup_dir).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_backup(backup_path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let db_path = get_db_location(app_handle)?;
    crate::backup::restore_backup(&backup_path, &db_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_backup_list(backup_dir: String) -> Result<Vec<BackupInfo>, String> {
    crate::backup::get_backup_list(&backup_dir).map_err(|e| e.to_string())
}
