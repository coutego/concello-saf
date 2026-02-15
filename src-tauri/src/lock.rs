use fd_lock::RwLock;
use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

pub struct FileLock {
    lock_file: PathBuf,
}

impl FileLock {
    pub fn new<P: AsRef<Path>>(path: P) -> io::Result<Self> {
        let lock_file = path.as_ref().to_path_buf();

        // Try to create the lock file
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&lock_file)?;

        // Write current process info
        let pid = std::process::id();
        writeln!(file, "{}", pid)?;
        drop(file);

        Ok(Self { lock_file })
    }

    pub fn acquire(&self) -> io::Result<LockGuard> {
        let file = OpenOptions::new().write(true).open(&self.lock_file)?;

        let mut lock = RwLock::new(file);
        lock.write()?;

        Ok(LockGuard { _lock: lock })
    }
}

pub struct LockGuard {
    _lock: RwLock<File>,
}

// Implement custom lock handling with timeout and stale lock detection
use std::time::{Duration, SystemTime};

pub struct SmartLock {
    lock_file: PathBuf,
    timeout_seconds: u64,
}

impl SmartLock {
    pub fn new<P: AsRef<Path>>(path: P, timeout_seconds: u64) -> io::Result<Self> {
        let lock_file = path.as_ref().to_path_buf();

        Ok(Self {
            lock_file,
            timeout_seconds,
        })
    }

    pub fn try_lock(&self) -> io::Result<Option<SmartLockGuard>> {
        // Check if lock file exists and is stale
        if self.lock_file.exists() {
            if let Ok(metadata) = std::fs::metadata(&self.lock_file) {
                if let Ok(modified) = metadata.modified() {
                    let elapsed = SystemTime::now()
                        .duration_since(modified)
                        .unwrap_or(Duration::from_secs(0));

                    // If lock is stale (older than timeout), remove it
                    if elapsed > Duration::from_secs(self.timeout_seconds) {
                        let _ = std::fs::remove_file(&self.lock_file);
                    } else {
                        return Ok(None); // Lock is held by another process
                    }
                }
            }
        }

        // Create new lock
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&self.lock_file)?;

        let pid = std::process::id();
        writeln!(file, "{}", pid)?;

        Ok(Some(SmartLockGuard {
            lock_file: self.lock_file.clone(),
        }))
    }

    pub fn lock_with_timeout(&self, timeout_secs: u64) -> io::Result<SmartLockGuard> {
        let start = SystemTime::now();

        loop {
            if let Some(guard) = self.try_lock()? {
                return Ok(guard);
            }

            // Check if we've exceeded timeout
            if let Ok(elapsed) = SystemTime::now().duration_since(start) {
                if elapsed.as_secs() > timeout_secs {
                    return Err(io::Error::new(
                        io::ErrorKind::TimedOut,
                        "Could not acquire lock within timeout period",
                    ));
                }
            }

            // Wait a bit before retrying
            std::thread::sleep(Duration::from_millis(100));
        }
    }
}

pub struct SmartLockGuard {
    lock_file: PathBuf,
}

impl Drop for SmartLockGuard {
    fn drop(&mut self) {
        // Remove lock file when guard is dropped
        let _ = std::fs::remove_file(&self.lock_file);
    }
}
