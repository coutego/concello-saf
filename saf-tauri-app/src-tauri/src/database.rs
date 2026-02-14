use chrono::Local;
use rusqlite::{params, Connection, Result};
use std::path::Path;
use uuid::Uuid;

use crate::models::*;

// Lista expandida de artigos por defecto que se poden engadir
pub const DEFAULT_ITEMS: &[(&str, &str, &str, &str)] = &[
    // Mobilidade
    (
        "Cama eléctrica",
        "Cama articulada eléctrica con mando",
        "mobility",
        "🛏️",
    ),
    ("Cama manual", "Cama articulada manual", "mobility", "🛏️"),
    (
        "Cadeira de rodas",
        "Cadeira de rodas manual estándar",
        "mobility",
        "♿",
    ),
    (
        "Cadeira de rodas eléctrica",
        "Cadeira de rodas eléctrica",
        "mobility",
        "♿",
    ),
    ("Andador", "Andador de aluminio regulable", "mobility", "🚶"),
    (
        "Andador con rodas",
        "Andador con 4 rodas e freos",
        "mobility",
        "🚶",
    ),
    ("Muletas", "Par de muletas axustables", "mobility", "🦯"),
    (
        "Muletas canadenses",
        "Par de muletas canadenses",
        "mobility",
        "🦯",
    ),
    ("Bastón", "Bastón simple", "mobility", "🦯"),
    (
        "Bastón tripode",
        "Bastón con base de 3 puntas",
        "mobility",
        "🦯",
    ),
    ("Scooter", "Scooter eléctrico", "mobility", "🛴"),
    // Baño
    (
        "Cadeira para duchas",
        "Cadeira con respaldo para ducha",
        "bathroom",
        "🚿",
    ),
    (
        "Banqueta de ducha",
        "Banqueta sen respaldo",
        "bathroom",
        "🚿",
    ),
    ("Elevador de WC", "Elevador para inodoro", "bathroom", "🚽"),
    (
        "Barras de baño",
        "Xogo de barras para baño",
        "bathroom",
        "🛁",
    ),
    (
        "Tapete antideslizante",
        "Tapete para ducha",
        "bathroom",
        "🛁",
    ),
    // Transferencia
    ("Grúa", "Grúa para traslado de pacientes", "transfer", "🏗️"),
    ("Grúa de teito", "Grúa de teito con arnés", "transfer", "🏗️"),
    (
        "Prancha de transferencia",
        "Prancha para desprazamentos",
        "transfer",
        "📏",
    ),
    ("Arnés", "Arnés para grúa", "transfer", "🎽"),
    (
        "Cinturón de transferencia",
        "Cinturón de axuda",
        "transfer",
        "🎽",
    ),
    // Coidados
    ("Lavacabezas", "Lavacabezas portátil", "care", "💆"),
    ("Cortaúñas", "Cortaúñas especial", "care", "✂️"),
    ("Espejo", "Espejo de man", "care", "🪞"),
    ("Maniquí", "Maniquí para prácticas", "care", "🎎"),
    // Colchóns e postura
    (
        "Colchón antiescaras",
        "Colchón de aire antiescaras",
        "bed",
        "🛏️",
    ),
    (
        "Colchón viscoelástico",
        "Colchón viscoelástico",
        "bed",
        "🛏️",
    ),
    (
        "Colchón de espuma",
        "Colchón de espuma estándar",
        "bed",
        "🛏️",
    ),
    ("Coxín antiescaras", "Coxín de aire ou xeles", "bed", "🪑"),
    ("Coxín postural", "Coxín para postura", "bed", "🪑"),
    ("Cuña", "Cuña de posicionamento", "bed", "📐"),
    ("Roldana", "Roldana para talóns", "bed", "🦶"),
    ("Barreiras de cama", "Barreiras de seguridade", "bed", "🛡️"),
    // Respiración
    ("Nebulizador", "Nebulizador eléctrico", "respiratory", "💨"),
    ("Aspirador", "Aspirador de secrecións", "respiratory", "🫁"),
    ("Oxímetro", "Oxímetro de pulso", "respiratory", "💓"),
    ("Termómetro", "Termómetro dixital", "respiratory", "🌡️"),
    // Alimentación
    (
        "Vaso antigoteo",
        "Vaso con tapa e boquilla",
        "feeding",
        "🥤",
    ),
    ("Prato con bordo", "Prato alto nos bordos", "feeding", "🍽️"),
    (
        "Cubertos adaptados",
        "Cubertos con mangos anchos",
        "feeding",
        "🍴",
    ),
    ("Bib", "Babeteiro adulto", "feeding", "👶"),
    // Vestir
    ("Calzador", "Calzador de calcetíns", "dressing", "🧦"),
    ("Botón", "Axuda para abrochar", "dressing", "👔"),
    ("Zapateiro", "Calzador de zapatos", "dressing", "👟"),
    // Comunicación
    ("Lupa", "Lupa de man", "communication", "🔍"),
    ("Audífonos", "Amplificador de son", "communication", "🎧"),
    ("Campá", "Campá de chamada", "communication", "🔔"),
    // Outros
    ("Almofada", "Almofada xeral", "other", "🛋️"),
    ("Bolsa de auga quente", "Bolsa térmica", "other", "♨️"),
    ("Manta eléctrica", "Manta con calefacción", "other", "🔌"),
    ("Mesa de cama", "Mesa para cama", "other", "🛏️"),
    ("Portaoxíxeno", "Carro para botellas", "other", "🛒"),
];

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        let db = Self { conn };
        db.init_tables()?;
        // Non engadimos artigos por defecto - o inventario comeza baleiro

        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        // Users table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                dni TEXT UNIQUE NOT NULL,
                address TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Items table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                icon TEXT NOT NULL,
                total_stock INTEGER NOT NULL DEFAULT 0,
                available_stock INTEGER NOT NULL DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Loans table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS loans (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                start_date DATE NOT NULL,
                expected_end_date DATE NOT NULL,
                actual_end_date DATE,
                status TEXT NOT NULL DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",
            [],
        )?;

        // Loan items table (many-to-many)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS loan_items (
                id TEXT PRIMARY KEY,
                loan_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items(id)
            )",
            [],
        )?;

        // Events table (Event Sourcing)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                loan_id TEXT,
                user_id TEXT,
                cancelled_by TEXT,
                cancellation_reason TEXT
            )",
            [],
        )?;

        // Create indexes
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loan_items_loan_id ON loan_items(loan_id)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)",
            [],
        )?;

        Ok(())
    }

    // Engadir artigos por defecto (chámase manualmente cando o usuario quere)
    pub fn add_default_items(&self) -> Result<Vec<Item>> {
        let mut added_items = Vec::new();
        let now = Local::now().naive_local();

        for (name, desc, category, icon) in DEFAULT_ITEMS {
            // Comprobar se xa existe un artigo con este nome
            let exists: bool = self.conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM items WHERE name = ?1)",
                [*name],
                |row| row.get(0),
            )?;

            if !exists {
                let id = Uuid::new_v4().to_string();
                self.conn.execute(
                    "INSERT INTO items (id, name, description, category, icon, total_stock, available_stock, created_at, updated_at) 
                     VALUES (?1, ?2, ?3, ?4, ?5, 0, 0, ?6, ?6)",
                    params![id, name, desc, category, icon, now],
                )?;

                let item = Item {
                    id,
                    name: name.to_string(),
                    description: Some(desc.to_string()),
                    category: category.to_string(),
                    icon: icon.to_string(),
                    total_stock: 0,
                    available_stock: 0,
                    notes: None,
                    created_at: now,
                    updated_at: now,
                };
                added_items.push(item.clone());

                self.log_event(
                    "ITEM_CREATED",
                    serde_json::json!({"itemId": &item.id, "name": name, "source": "default_list"}),
                    None,
                    None,
                )?;
            }
        }

        Ok(added_items)
    }

    // Crear un artigo personalizado
    pub fn create_item(&self, req: CreateItemRequest) -> Result<Item> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().naive_local();

        self.conn.execute(
            "INSERT INTO items (id, name, description, category, icon, total_stock, available_stock, notes, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8, ?8)",
            params![id, req.name, req.description, req.category, req.icon, req.total_stock, req.notes, now],
        )?;

        self.log_event(
            "ITEM_CREATED",
            serde_json::json!({"itemId": &id, "name": &req.name, "source": "custom"}),
            None,
            None,
        )?;

        self.get_item_by_id(&id)
    }

    // Actualizar stock dun artigo
    pub fn update_item_stock(&self, item_id: &str, new_total_stock: i32) -> Result<Item> {
        let now = Local::now().naive_local();

        // Obter stock actual para calcular diferenza
        let current: (i32, i32) = self.conn.query_row(
            "SELECT total_stock, available_stock FROM items WHERE id = ?1",
            [item_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let (current_total, current_available) = current;
        let difference = new_total_stock - current_total;
        let new_available = current_available + difference;

        self.conn.execute(
            "UPDATE items SET total_stock = ?1, available_stock = ?2, updated_at = ?3 WHERE id = ?4",
            params![new_total_stock, new_available, now, item_id],
        )?;

        self.log_event(
            "STOCK_UPDATED",
            serde_json::json!({
                "itemId": item_id,
                "previousTotal": current_total,
                "newTotal": new_total_stock,
                "previousAvailable": current_available,
                "newAvailable": new_available
            }),
            None,
            None,
        )?;

        self.get_item_by_id(item_id)
    }

    pub fn get_item_by_id(&self, id: &str) -> Result<Item> {
        self.conn.query_row(
            "SELECT id, name, description, category, icon, total_stock, available_stock, notes, created_at, updated_at 
             FROM items WHERE id = ?1",
            [id],
            |row| {
                Ok(Item {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    category: row.get(3)?,
                    icon: row.get(4)?,
                    total_stock: row.get(5)?,
                    available_stock: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
    }

    // User operations
    pub fn create_user(&self, req: CreateUserRequest) -> Result<User> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().naive_local();

        self.conn.execute(
            "INSERT INTO users (id, name, dni, address, phone, email, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
            params![
                id, req.name, req.dni, req.address, req.phone, req.email, req.notes, now
            ],
        )?;

        self.log_event(
            "USER_CREATED",
            serde_json::json!({"userId": &id, "name": &req.name}),
            None,
            Some(&id),
        )?;

        self.get_user_by_id(&id)
    }

    pub fn get_user_by_id(&self, id: &str) -> Result<User> {
        self.conn.query_row(
            "SELECT id, name, dni, address, phone, email, notes, created_at, updated_at 
             FROM users WHERE id = ?1",
            [id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    dni: row.get(2)?,
                    address: row.get(3)?,
                    phone: row.get(4)?,
                    email: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
    }

    pub fn get_users(&self) -> Result<Vec<User>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, dni, address, phone, email, notes, created_at, updated_at 
             FROM users ORDER BY name",
        )?;

        let users = stmt
            .query_map([], |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    dni: row.get(2)?,
                    address: row.get(3)?,
                    phone: row.get(4)?,
                    email: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(users)
    }

    pub fn search_users(&self, query: &str) -> Result<Vec<User>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, name, dni, address, phone, email, notes, created_at, updated_at 
             FROM users 
             WHERE name LIKE ?1 OR dni LIKE ?1 OR address LIKE ?1
             ORDER BY name",
        )?;

        let users = stmt
            .query_map([&search_pattern], |row| {
                Ok(User {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    dni: row.get(2)?,
                    address: row.get(3)?,
                    phone: row.get(4)?,
                    email: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(users)
    }

    pub fn update_user(&self, id: &str, req: UpdateUserRequest) -> Result<User> {
        let now = Local::now().naive_local();

        let mut updates = vec![];
        let mut params: Vec<&dyn rusqlite::ToSql> = vec![];

        if let Some(name) = &req.name {
            updates.push("name = ?");
            params.push(name);
        }
        if let Some(dni) = &req.dni {
            updates.push("dni = ?");
            params.push(dni);
        }
        if let Some(address) = &req.address {
            updates.push("address = ?");
            params.push(address);
        }
        if let Some(phone) = &req.phone {
            updates.push("phone = ?");
            params.push(phone);
        }
        if let Some(email) = &req.email {
            updates.push("email = ?");
            params.push(email);
        }
        if let Some(notes) = &req.notes {
            updates.push("notes = ?");
            params.push(notes);
        }

        if !updates.is_empty() {
            updates.push("updated_at = ?");
            params.push(&now);

            let query = format!("UPDATE users SET {} WHERE id = ?", updates.join(", "));
            params.push(&id);

            self.conn.execute(&query, params.as_slice())?;

            self.log_event(
                "USER_UPDATED",
                serde_json::json!({"userId": id, "changes": &req}),
                None,
                Some(id),
            )?;
        }

        self.get_user_by_id(id)
    }

    pub fn delete_user(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM users WHERE id = ?1", [id])?;
        self.log_event(
            "USER_DELETED",
            serde_json::json!({"userId": id}),
            None,
            Some(id),
        )?;
        Ok(())
    }

    // Item operations
    pub fn get_items(&self) -> Result<Vec<Item>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, category, icon, total_stock, available_stock, notes, created_at, updated_at 
             FROM items ORDER BY name"
        )?;

        let items = stmt
            .query_map([], |row| {
                Ok(Item {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    category: row.get(3)?,
                    icon: row.get(4)?,
                    total_stock: row.get(5)?,
                    available_stock: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    pub fn search_items(&self, query: &str) -> Result<Vec<Item>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, category, icon, total_stock, available_stock, notes, created_at, updated_at 
             FROM items 
             WHERE name LIKE ?1 OR description LIKE ?1
             ORDER BY name"
        )?;

        let items = stmt
            .query_map([&search_pattern], |row| {
                Ok(Item {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    category: row.get(3)?,
                    icon: row.get(4)?,
                    total_stock: row.get(5)?,
                    available_stock: row.get(6)?,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    // Loan operations
    pub fn create_loan(&self, req: CreateLoanRequest) -> Result<Loan> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().naive_local();

        // Check user exists
        let _user: User = self.get_user_by_id(&req.user_id)?;

        // Check items availability
        for item_id in &req.item_ids {
            let available: i32 = self.conn.query_row(
                "SELECT available_stock FROM items WHERE id = ?1",
                [item_id],
                |row| row.get(0),
            )?;

            if available < 1 {
                return Err(rusqlite::Error::InvalidParameterName(format!(
                    "Item {} not available",
                    item_id
                )));
            }
        }

        // Create loan
        self.conn.execute(
            "INSERT INTO loans (id, user_id, start_date, expected_end_date, status, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 'active', ?5, ?6, ?6)",
            params![id, req.user_id, req.start_date, req.expected_end_date, req.notes, now],
        )?;

        // Add loan items and update stock
        for item_id in &req.item_ids {
            let loan_item_id = Uuid::new_v4().to_string();
            self.conn.execute(
                "INSERT INTO loan_items (id, loan_id, item_id, quantity) VALUES (?1, ?2, ?3, 1)",
                params![loan_item_id, id, item_id],
            )?;

            // Update stock
            self.conn.execute(
                "UPDATE items SET available_stock = available_stock - 1, updated_at = ?1 WHERE id = ?2",
                params![now, item_id],
            )?;
        }

        // Log event
        self.log_event(
            "LOAN_CREATED",
            serde_json::json!({
                "loanId": &id,
                "userId": &req.user_id,
                "items": &req.item_ids,
                "startDate": &req.start_date,
                "expectedEndDate": &req.expected_end_date
            }),
            Some(&id),
            Some(&req.user_id),
        )?;

        // Log stock reserved for each item
        for item_id in &req.item_ids {
            self.log_event(
                "STOCK_RESERVED",
                serde_json::json!({
                    "itemId": item_id,
                    "quantity": 1,
                    "loanId": &id
                }),
                Some(&id),
                Some(&req.user_id),
            )?;
        }

        self.get_loan_by_id(&id)
    }

    pub fn get_loan_by_id(&self, id: &str) -> Result<Loan> {
        let loan = self.conn.query_row(
            "SELECT l.id, l.user_id, u.name as user_name, l.start_date, l.expected_end_date, 
                    l.actual_end_date, l.status, l.notes, l.created_at, l.updated_at
             FROM loans l
             JOIN users u ON l.user_id = u.id
             WHERE l.id = ?1",
            [id],
            |row| {
                let status_str: String = row.get(6)?;
                let status = match status_str.as_str() {
                    "pending" => LoanStatus::Pending,
                    "returned" => LoanStatus::Returned,
                    "overdue" => LoanStatus::Overdue,
                    _ => LoanStatus::Active,
                };

                Ok(Loan {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    user_name: row.get(2)?,
                    start_date: row.get(3)?,
                    expected_end_date: row.get(4)?,
                    actual_end_date: row.get(5)?,
                    status,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    items: vec![],
                })
            },
        )?;

        // Get loan items
        let items = self.get_loan_items(id)?;

        Ok(Loan { items, ..loan })
    }

    fn get_loan_items(&self, loan_id: &str) -> Result<Vec<LoanItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT li.id, li.loan_id, li.item_id, i.name as item_name, li.quantity
             FROM loan_items li
             JOIN items i ON li.item_id = i.id
             WHERE li.loan_id = ?1",
        )?;

        let items = stmt
            .query_map([loan_id], |row| {
                Ok(LoanItem {
                    id: row.get(0)?,
                    loan_id: row.get(1)?,
                    item_id: row.get(2)?,
                    item_name: row.get(3)?,
                    quantity: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    pub fn get_loans(&self) -> Result<Vec<Loan>> {
        let mut stmt = self.conn.prepare(
            "SELECT l.id, l.user_id, u.name as user_name, l.start_date, l.expected_end_date, 
                    l.actual_end_date, l.status, l.notes, l.created_at, l.updated_at
             FROM loans l
             JOIN users u ON l.user_id = u.id
             ORDER BY l.created_at DESC",
        )?;

        let loans = stmt
            .query_map([], |row| {
                let status_str: String = row.get(6)?;
                let status = match status_str.as_str() {
                    "pending" => LoanStatus::Pending,
                    "returned" => LoanStatus::Returned,
                    "overdue" => LoanStatus::Overdue,
                    _ => LoanStatus::Active,
                };

                Ok(Loan {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    user_name: row.get(2)?,
                    start_date: row.get(3)?,
                    expected_end_date: row.get(4)?,
                    actual_end_date: row.get(5)?,
                    status,
                    notes: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    items: vec![],
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        // Populate items for each loan
        let mut loans_with_items = Vec::new();
        for loan in loans {
            let items = self.get_loan_items(&loan.id)?;
            loans_with_items.push(Loan { items, ..loan });
        }

        Ok(loans_with_items)
    }

    pub fn return_loan(
        &self,
        loan_id: &str,
        condition: Option<String>,
        notes: Option<String>,
    ) -> Result<Loan> {
        let now = Local::now().naive_local();
        let today = Local::now().naive_local().date();

        // Get loan items to restore stock
        let items = self.get_loan_items(loan_id)?;

        // Update loan status
        self.conn.execute(
            "UPDATE loans SET status = 'returned', actual_end_date = ?1, notes = COALESCE(?2, notes), updated_at = ?3 WHERE id = ?4",
            params![today, notes, now, loan_id],
        )?;

        // Restore stock
        for item in &items {
            self.conn.execute(
                "UPDATE items SET available_stock = available_stock + ?1, updated_at = ?2 WHERE id = ?3",
                params![item.quantity, now, item.item_id],
            )?;

            // Log stock released
            self.log_event(
                "STOCK_RELEASED",
                serde_json::json!({
                    "itemId": &item.item_id,
                    "quantity": item.quantity,
                    "loanId": loan_id
                }),
                Some(loan_id),
                None,
            )?;
        }

        // Log event
        self.log_event(
            "LOAN_RETURNED",
            serde_json::json!({
                "loanId": loan_id,
                "condition": &condition,
                "notes": &notes
            }),
            Some(loan_id),
            None,
        )?;

        self.get_loan_by_id(loan_id)
    }

    // Cancelar unha devolución (reabrir o préstamo)
    pub fn cancel_return(&self, loan_id: &str, reason: Option<String>) -> Result<Loan> {
        let now = Local::now().naive_local();

        // Get loan items to reserve stock again
        let items = self.get_loan_items(loan_id)?;

        // Update loan status back to active
        self.conn.execute(
            "UPDATE loans SET status = 'active', actual_end_date = NULL, updated_at = ?1 WHERE id = ?2",
            params![now, loan_id],
        )?;

        // Reserve stock again
        for item in &items {
            self.conn.execute(
                "UPDATE items SET available_stock = available_stock - ?1, updated_at = ?2 WHERE id = ?3",
                params![item.quantity, now, item.item_id],
            )?;

            // Log stock reserved again
            self.log_event(
                "STOCK_RESERVED",
                serde_json::json!({
                    "itemId": &item.item_id,
                    "quantity": item.quantity,
                    "loanId": loan_id,
                    "reason": "return_cancelled"
                }),
                Some(loan_id),
                None,
            )?;
        }

        // Log cancellation event
        self.log_event(
            "RETURN_CANCELLED",
            serde_json::json!({
                "loanId": loan_id,
                "reason": &reason,
                "cancelledAt": now.to_string()
            }),
            Some(loan_id),
            None,
        )?;

        self.get_loan_by_id(loan_id)
    }

    pub fn update_overdue_loans(&self) -> Result<usize> {
        let today = Local::now().naive_local().date();

        let updated = self.conn.execute(
            "UPDATE loans SET status = 'overdue' 
             WHERE status = 'active' AND expected_end_date < ?1",
            [today],
        )?;

        Ok(updated)
    }

    // Event operations
    fn log_event(
        &self,
        event_type: &str,
        data: serde_json::Value,
        loan_id: Option<&str>,
        user_id: Option<&str>,
    ) -> Result<()> {
        let id = Uuid::new_v4().to_string();

        self.conn.execute(
            "INSERT INTO events (id, event_type, data, loan_id, user_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, event_type, data.to_string(), loan_id, user_id],
        )?;

        Ok(())
    }

    pub fn get_events(&self, limit: i64) -> Result<Vec<Event>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, event_type, data, created_at, loan_id, user_id 
             FROM events 
             ORDER BY created_at DESC 
             LIMIT ?1",
        )?;

        let events = stmt
            .query_map([limit], |row| {
                let data_str: String = row.get(2)?;
                let data = serde_json::from_str(&data_str).unwrap_or(serde_json::Value::Null);

                Ok(Event {
                    id: row.get(0)?,
                    event_type: row.get(1)?,
                    data,
                    created_at: row.get(3)?,
                    loan_id: row.get(4)?,
                    user_id: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(events)
    }

    // Dashboard stats
    pub fn get_dashboard_stats(&self) -> Result<DashboardStats> {
        let active_loans: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM loans WHERE status = 'active'",
            [],
            |row| row.get(0),
        )?;

        let pending_returns: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM loans WHERE status IN ('active', 'overdue')",
            [],
            |row| row.get(0),
        )?;

        let overdue_loans: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM loans WHERE status = 'overdue'",
            [],
            |row| row.get(0),
        )?;

        let total_items_available: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(available_stock), 0) FROM items",
            [],
            |row| row.get(0),
        )?;

        let total_users: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;

        let recent_loans = self.get_loans()?.into_iter().take(5).collect();
        let recent_events = self.get_events(10)?;

        Ok(DashboardStats {
            active_loans,
            pending_returns,
            overdue_loans,
            total_items_available,
            total_users,
            recent_loans,
            recent_events,
        })
    }
}
