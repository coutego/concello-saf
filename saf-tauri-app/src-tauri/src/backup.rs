use chrono::Local;
use std::fs;
use std::io::{Read, Write};
use std::path::Path;
use zip::write::FileOptions;

use crate::models::BackupInfo;

pub fn create_backup<P: AsRef<Path>>(db_path: P, backup_dir: P) -> Result<BackupInfo, String> {
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("saf_backup_{}.zip", timestamp);
    let backup_path = backup_dir.as_ref().join(&backup_name);

    // Create zip file
    let file = fs::File::create(&backup_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);

    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    // Add database file
    let db_file_name = db_path
        .as_ref()
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("database.db");

    zip.start_file(db_file_name, options)
        .map_err(|e| e.to_string())?;

    let mut db_file = fs::File::open(&db_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    db_file
        .read_to_end(&mut buffer)
        .map_err(|e| e.to_string())?;
    zip.write_all(&buffer).map_err(|e| e.to_string())?;

    // Add metadata file
    let metadata = serde_json::json!({
        "created_at": Local::now().to_rfc3339(),
        "version": env!("CARGO_PKG_VERSION"),
        "database_file": db_file_name,
    });

    zip.start_file("metadata.json", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(metadata.to_string().as_bytes())
        .map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;

    // Get file size
    let metadata = fs::metadata(&backup_path).map_err(|e| e.to_string())?;
    let size = metadata.len();

    Ok(BackupInfo {
        filename: backup_name,
        size,
        created_at: Local::now().naive_local(),
        path: backup_path.to_string_lossy().to_string(),
    })
}

pub fn restore_backup<P: AsRef<Path>>(backup_path: P, db_path: P) -> Result<(), String> {
    let file = fs::File::open(&backup_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    // Extract database file
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name();

        if name.ends_with(".db") || name.ends_with(".sqlite") || name.ends_with(".sqlite3") {
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

            // Backup current database first
            if db_path.as_ref().exists() {
                let backup_name = format!(
                    "{}.backup.{}",
                    db_path.as_ref().to_string_lossy(),
                    Local::now().format("%Y%m%d_%H%M%S")
                );
                fs::copy(&db_path, &backup_name).map_err(|e| e.to_string())?;
            }

            // Write restored database
            fs::write(&db_path, buffer).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }

    Err("No database file found in backup".to_string())
}

pub fn get_backup_list<P: AsRef<Path>>(backup_dir: P) -> Result<Vec<BackupInfo>, String> {
    let mut backups = Vec::new();

    if !backup_dir.as_ref().exists() {
        return Ok(backups);
    }

    for entry in fs::read_dir(&backup_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) == Some("zip") {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(created) = metadata.created() {
                    if let Ok(duration) = created.duration_since(std::time::UNIX_EPOCH) {
                        // Use chrono::DateTime::from_timestamp instead of deprecated NaiveDateTime::from_timestamp
                        let created_at =
                            chrono::DateTime::from_timestamp(duration.as_secs() as i64, 0)
                                .map(|dt| dt.naive_local())
                                .unwrap_or_else(|| Local::now().naive_local());

                        backups.push(BackupInfo {
                            filename: path
                                .file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("unknown")
                                .to_string(),
                            size: metadata.len(),
                            created_at,
                            path: path.to_string_lossy().to_string(),
                        });
                    }
                }
            }
        }
    }

    // Sort by creation date (newest first)
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(backups)
}
