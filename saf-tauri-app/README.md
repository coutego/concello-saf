# SAF Barreiros - Xestión de Préstamos

Aplicación de escritorio para xestionar préstamos de material do Servizo de Axuda ao Fogar (SAF) do Concello de Barreiros.

## 🚀 Características

- ✅ Interface moderna e intuitiva en galego
- ✅ Xestión de usuarios, artigos e préstamos
- ✅ Búsqueda difusa para usuarios e artigos
- ✅ Sistema de Event Sourcing (rexistro completo de accións)
- ✅ Exportación a Excel
- ✅ Copias de seguridade (backups)
- ✅ Base de datos SQLite en ficheiro compartido
- ✅ Funciona offline
- ✅ Soporte multiplataforma (Windows, macOS, Linux)

## 📦 Instalación

### Para usuarios (fácil)

1. Descarga o instalador correspondente ao teu sistema operativo desde a sección de releases
2. Executa o instalador e segue as instrucións
3. Na primeira execución, selecciona a carpeta onde queres gardar a base de datos (recomendado: carpeta compartida da rede)
4. Xa podes comezar a usar a aplicación!

### Para desenvolvedores

#### Requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

#### Configuración do proxecto

```bash
# Clonar o repositorio
git clone <url-do-repositorio>
cd saf-tauri-app

# Instalar dependencias de Node
npm install

# Instalar dependencias de Rust (feito automaticamente)
```

#### Execución en desenvolvemento

```bash
# Iniciar a app en modo desenvolvemento
npm run tauri-dev
```

#### Compilación para produción

```bash
# Compilar para a túa plataforma
npm run tauri-build

# Os binarios estarán en src-tauri/target/release/bundle/
```

#### Compilación para todas as plataformas

Nota: Para compilar para Windows desde macOS/Linux (ou viceversa), necesitas configurar un runner de GitHub Actions ou usar cross-compilation.

## 🗄️ Base de Datos

A aplicación usa SQLite como base de datos. O ficheiro da base de datos (`saf_database.db`) pódese gardar en calquera localización:

- **Local**: Directorio de datos da aplicación (por defecto)
- **Carpeta compartida**: Ideal para acceso dende varios equipos da rede

### Estrutura da BD

- **users**: Usuarios do servizo
- **items**: Artigos dispoñibles para préstamo
- **loans**: Préstamos (con estados: active, pending, returned, overdue)
- **loan_items**: Relación préstamo-artigos
- **events**: Rexistro de eventos (Event Sourcing)

## 🔒 Concurrencia e Bloqueos

A aplicación implementa un sistema de bloqueo de ficheiros para permitir o acceso dende varios equipos simultaneamente:

- Cando un usuario abre a app, adquire un bloqueo sobre a base de datos
- Se outro usuario intenta acceder mentres está bloqueada, agarda automaticamente
- Os bloqueos téñen timeout (30 segundos) para evitar bloqueos permanentes en caso de crash

## 📊 Event Sourcing

Todas as accións importantes rexístranse como eventos:

- `USER_CREATED`: Creación de usuario
- `USER_UPDATED`: Actualización de usuario
- `LOAN_CREATED`: Novo préstamo
- `LOAN_RETURNED`: Devolución de préstamo
- `STOCK_RESERVED`: Reserva de stock
- `STOCK_RELEASED`: Liberación de stock
- `BACKUP_CREATED`: Creación de backup

Isto permite:
- Auditar todas as accións
- Reconstruír o estado da base de datos
- Detectar problemas ou erros

## 📁 Estrutura do Proxecto

```
saf-tauri-app/
├── src/                    # Código fonte do frontend
│   ├── main.js            # Lóxica principal e comunicación co backend
│   └── styles.css         # Estilos CSS
├── src-tauri/             # Código fonte do backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Punto de entrada
│   │   ├── database.rs    # Operacións coa base de datos
│   │   ├── models.rs      # Estruturas de datos
│   │   ├── commands.rs    # Comandos Tauri (API)
│   │   ├── excel.rs       # Exportación a Excel
│   │   ├── backup.rs      # Funcións de backup
│   │   └── lock.rs        # Sistema de bloqueo
│   ├── Cargo.toml         # Dependencias de Rust
│   └── tauri.conf.json    # Configuración de Tauri
├── index.html             # HTML principal
├── package.json           # Dependencias de Node
└── vite.config.js         # Configuración de Vite
```

## 🛠️ Tecnoloxías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Rust + Tauri
- **Base de datos**: SQLite
- **Exportación**: XLSX Writer (Rust)
- **Empaquetado**: Tauri

## 📝 Licenza

Este proxecto é propiedade do Concello de Barreiros.

## 🤝 Soporte

Para reportar problemas ou solicitar funcionalidades, por favor crea un issue no repositorio ou contacta co equipo de soporte do Concello de Barreiros.

## 🔄 Changelog

### v1.0.0
- Lanzamento inicial
- Xestión completa de usuarios, artigos e préstamos
- Sistema de Event Sourcing
- Exportación a Excel
- Backups automáticos
- Soporte multiplataforma