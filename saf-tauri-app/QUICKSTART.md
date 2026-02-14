# SAF Barreiros - Instrucións Rápidas

## 🚀 Comezar en 5 minutos

### 1. Instalar dependencias (só unha vez)

```bash
# Instalar Node.js desde https://nodejs.org/
# Instalar Rust:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reiniciar o terminal e verificar:
node --version  # Debe ser v18 ou superior
rustc --version # Debe mostrar a versión de Rust
```

### 2. Compilar a aplicación

```bash
cd saf-tauri-app
npm install
npm run tauri-build
```

### 3. Distribuír

Os instaladores xeraranse en:
- **Windows**: `src-tauri/target/release/bundle/msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg`
- **Linux**: `src-tauri/target/release/bundle/deb/*.deb`

## 📁 Estrutura do Proxecto

```
saf-tauri-app/
├── src/                    # Frontend (HTML/CSS/JS)
│   ├── main.js            # Lóxica principal
│   └── styles.css         # Estilos
├── src-tauri/             # Backend (Rust)
│   └── src/
│       ├── main.rs        # Punto de entrada
│       ├── database.rs    # Base de datos SQLite
│       ├── commands.rs    # API
│       ├── excel.rs       # Exportación Excel
│       └── backup.rs      # Backups
└── README.md              # Documentación completa
```

## 🔧 Desenvolvemento

### Iniciar en modo desenvolvemento

```bash
npm run tauri-dev
```

Isto inicia a app con hot-reload (cambios en tempo real).

### Estrutura da Base de Datos

**Táboas principais:**
- `users` - Usuarios do servizo
- `items` - Artigos dispoñibles
- `loans` - Préstamos
- `loan_items` - Relación préstamos-artigos
- `events` - Rexistro de eventos (Event Sourcing)

## 🐛 Depuración

### Ver logs da base de datos

Abre o ficheiro `saf_database.db` con calquera cliente SQLite (ex: DB Browser for SQLite).

### Ver eventos da aplicación

Dentro da app: "Sistema" → "Rexistro de Eventos"

### Problemas comúns

1. **"database is locked"** → Pecha a app noutros ordenadores ou elimina o ficheiro `.lock`
2. **Erro ao compilar** → Asegúrate de ter as últimas versións de Node e Rust
3. **Non atopa a base de datos** → Verifica os permisos da carpeta

## 📞 Contacto

Para soporte técnico ou dúbidas sobre o desenvolvemento, consulta o arquivo `GUIA_INSTALACION.md` completo.