use fs2::FileExt;
use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

pub struct FileLock {
    lock_file: File,
    lock_path: PathBuf,
}

impl FileLock {
    pub fn new<P: AsRef<Path>>(path: P) -> io::Result<Self> {
        let lock_path = path.as_ref().to_path_buf();

        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&lock_path)?;

        let pid = std::process::id();
        writeln!(file, "{}", pid)?;

        file.lock_exclusive()?;

        Ok(FileLock {
            lock_file: file,
            lock_path,
        })
    }
}

impl Drop for FileLock {
    fn drop(&mut self) {
        let _ = self.lock_file.unlock();
        let _ = std::fs::remove_file(&self.lock_path);
    }
}
