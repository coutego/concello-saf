# Manual de Desenvolvemento - SAF Barreiros

## Introdución

Este manual está dirixido ás persoas que queiran compilar a aplicación SAF desde o código fonte ou modificar a súa funcionalidade. Aquí atoparás toda a información necesaria para configurar o entorno de desenvolvemento, compilar a aplicación e utilizar ferramentas avanzadas para modificar o código.

---

## 1. Visión Xeral do Proxecto

### 1.1 Que Tecnologías Usa?

A aplicación SAF está construída con:

| Tecnoloxía | Uso | Versión |
|------------|-----|---------|
| **Tauri** | Framework de aplicacións de escritorio | 1.5 |
| **Rust** | Lenguaxe de programación backend | Estable |
| **React** | Interface de usuario frontend | 19 |
| **SQLite** | Base de datos | 3 |
| **Vite** | Servidor de desenvolvemento frontend | 5 |

### 1.2 Estrutura do Proxecto

```
saf-tauri-app/
├── src/                      ← Código React (interface de usuario)
│   ├── components/           ← Componentes React
│   ├── pages/                ← Páxinas da aplicación
│   └── App.jsx               ← Componente principal
├── src-tauri/                ← Código Rust (backend)
│   ├── src/
│   │   ├── main.rs           ← Punto de entrada
│   │   ├── database.rs       ← Lóxica de base de datos
│   │   ├── commands.rs       ← Comandos Tauri (API)
│   │   ├── backup.rs         ← Sistema de backups
│   │   ├── excel.rs          ← Exportación a Excel/PDF
│   │   ├── models.rs         ← Estruturas de datos
│   │   └── lock.rs           ← Bloqueo de ficheiros
│   ├── Cargo.toml            ← Dependencias Rust
│   └── tauri.conf.json       ← Configuración Tauri
├── package.json              ← Dependencias Node.js
└── vite.config.js            ← Configuración Vite
```

---

## 2. Preparación do Entorno

### 2.1 Requisitos en Windows

#### Paso 1: Instalar Node.js

1. Descarga Node.js desde: https://nodejs.org/
2. Escolle a versión **LTS** (Long Term Support)
3. Executa o instalador e segue os pasos
4. Verifica a instalación:
   ```cmd
   node --version
   npm --version
   ```

#### Paso 2: Instalar Rust

1. Descarga Rustup desde: https://rustup.rs/
2. Executa `rustup-init.exe`
3. Selecciona a opción por defecto (1)
4. Verifica a instalación:
   ```cmd
   rustc --version
   cargo --version
   ```

#### Paso 3: Instalar Microsoft Visual Studio Build Tools

1. Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Na instalación, selecciona **"Desenvolvemento de escritorio con C++"**
3. Isto é necesario para compilar as dependencias nativas

#### Paso 4: Instalar WebView2

En Windows 10/11 xa está incluído. En Windows 10 antigo:
1. Descarga desde: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Instala o runtime

### 2.2 Requisitos en Linux (Ubuntu/Debian)

Abre un terminal e executa:

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Instalar dependencias de sistema
sudo apt install -y libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Verificar instalación
node --version
rustc --version
```

### 2.3 Requisitos en macOS

```bash
# Instalar Homebrew (se non o tes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verificar instalación
node --version
rustc --version
```

---

## 3. Compilar a Aplicación

### 3.1 Descargar o Código Fonte

```bash
# Se tes acceso ao repositorio Git
git clone [URL-do-repositorio]
cd saf-tauri-app

# Se tes o código nun ficheiro ZIP
# Descomprime e entra na carpeta
cd saf-tauri-app
```

### 3.2 Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install
```

### 3.3 Compilar en Modo Desenvolvemento

Para probas durante o desenvolvemento:

```bash
# Iniciar servidor de desenvolvemento
npm run tauri-dev
```

Isto abre a aplicación con ferramentas de depuración activadas.

### 3.4 Compilar para Producción

Para crear o executable final:

```bash
# Compilar versión de producción
npm run tauri-build
```

O executable estará en:

| Sistema | Localización |
|---------|--------------|
| **Windows** | `src-tauri/target/release/bundle/msi/` ou `src-tauri/target/release/*.exe` |
| **macOS** | `src-tauri/target/release/bundle/dmg/` ou `src-tauri/target/release/bundle/macos/` |
| **Linux** | `src-tauri/target/release/bundle/deb/` ou `src-tauri/target/release/bundle/appimage/` |

**Tipos de paquetes xerados**:

| Sistema | Formatos |
|---------|----------|
| **Windows** | `.exe` (standalone), `.msi` (instalador) |
| **macOS** | `.dmg` (instalador), `.app` (aplicación) |
| **Linux** | `.deb` (Debian/Ubuntu), `.AppImage` (universal) |

### 3.5 Comandos Dispoñibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia só o servidor frontend (sen Tauri) |
| `npm run build` | Compila só o frontend |
| `npm run tauri-dev` | Inicia a aplicación en modo desenvolvemento |
| `npm run tauri-build` | Compila a aplicación completa para produción |

---

## 4. Estructura do Código

### 4.1 Backend (Rust)

O código Rust está en `src-tauri/src/`:

| Ficheiro | Función |
|----------|---------|
| `main.rs` | Inicialización da aplicación |
| `commands.rs` | Funcións que se chamam desde a interface |
| `database.rs` | Operacións coa base de datos SQLite |
| `backup.rs` | Crear e restaurar backups |
| `excel.rs` | Exportación a Excel e PDF |
| `models.rs` | Definición de tipos de datos |
| `lock.rs` | Sistema de bloqueo para acceso concurrente |

### 4.2 Frontend (React)

O código React está en `src/`:

| Carpeta/Ficheiro | Función |
|------------------|---------|
| `components/` | Elementos reutilizables (botóns, formularios) |
| `pages/` | Páxinas principais da aplicación |
| `App.jsx` | Componente raíz e enrutamento |

### 4.3 Como se Comunican Frontend e Backend

A comunicación realízase mediante **comandos Tauri**:

1. En **Rust** (`commands.rs`), defínense funcións marcadas con `#[tauri::command]`
2. En **React**, chámanse estas funcións usando `invoke()`:

```javascript
// Frontend (React)
import { invoke } from '@tauri-apps/api/tauri';

const usuarios = await invoke('get_users');
```

```rust
// Backend (Rust)
#[tauri::command]
fn get_users(state: State<AppState>) -> Result<Vec<User>, String> {
    // ... lóxica para obter usuarios
}
```

---

## 5. Modificar a Aplicación con OpenCode

### 5.1 Que é OpenCode?

OpenCode é unha ferramenta de intelixencia artificial que pode axudarche a escribir e modificar código. Pode usar modelos avanzados como **GLM-5**, **Kimi K2.5** ou **Claude**.

### 5.2 Instalación de OpenCode

1. Instala OpenCode seguindo as instrucións en: https://opencode.ai
2. Configura o modelo que queiras usar

### 5.3 Como Usar OpenCode para Modificar o Código

#### Exemplo: Engadir un Novo Campo ao Usuario

Podes pedir a OpenCode:

```
Engade un campo "data de nacemento" aos usuarios. 
O campo debe ser opcional e aparecer no formulario de creación/edición.
Tamén debe aparecer na exportación a Excel.
```

OpenCode analizará o código e fará os cambios necesarios en:
1. `models.rs` - engadir o campo á estrutura User
2. `database.rs` - modificar as consultas SQL
3. `commands.rs` - actualizar os comandos
4. `src/components/` - modificar os formularios
5. `excel.rs` - engadir o campo á exportación

#### Exemplo: Engadir un Novo Informe

Podes pedir:

```
Crea un novo informe que mostre os artigos mais prestados no último mes.
O informe debe aparecer nunha nova pestana "Estatísticas" e poderse exportar a PDF.
```

OpenCode creará:
1. Unha nova función en `commands.rs` para os datos
2. Unha nova páxina en `src/pages/`
3. Unha nova función de exportación en `excel.rs`
4. A integración no menú principal

### 5.4 Modelos Recomendados

| Modelo | Cando usalo |
|--------|-------------|
| **GLM-5** | Tarefas xerais de programación, bo rendemento |
| **Claude** | Tarefas complexas, mellor comprensión de contexto |
| **Kimi K2.5** | Bo para taremas en español/galego |

### 5.5 Consellos para Traballar con OpenCode

1. **Sé específico**: Describe exactamente que queres facer
2. **Proporciona contexto**: Indica en que ficheiros hai que facer cambios
3. **Verifica os cambios**: Revisa sempre o código que OpenCode xera
4. **Fai probas**: Compila e proba a aplicación despois de cada cambio

### 5.6 Exemplo de Prompt Efectivo

```
Quero engadir un sistema de notificacións que avise cando un préstamo 
leva mais de 7 días sen devolver. 

Requisitos:
1. Na páxina principal debe aparecer un contador de préstamos atrasados
2. Ao facer clic no contador, debe abrir unha lista detallada
3. Debe haber un botón para enviar lembretes por email (só simular, non enviar realmente)

Modifica os ficheiros necesarios e asegúrate de que todo compile.
```

---

## 6. Probas e Depuración

### 6.1 Verificar que o Código Compila

Antes de facer cambios grandes:

```bash
# Verificar que o Rust compila
cd src-tauri
cargo check

# Verificar que o frontend compila
cd ..
npm run build
```

### 6.2 Ver os Logs

Durante o desenvolvemento, os logs aparecen no terminal onde executaches `npm run tauri-dev`.

Para engadir logs no código Rust:

```rust
println!("Debug: usuario creado con ID {}", user.id);
```

### 6.3 Probar a Base de Datos

Podes abrir a base de datos SQLite con ferramentas externas:

- **DB Browser for SQLite** (gratuito): https://sqlitebrowser.org/
- **DBeaver** (gratuito): https://dbeaver.io/

A base de datos está en:

| Sistema | Localización |
|---------|--------------|
| **Windows** | `%LOCALAPPDATA%\es.concellodebarreiros.saf\saf_database.db` |
| **macOS** | `~/Library/Application Support/es.concellodebarreiros.saf/saf_database.db` |
| **Linux** | `~/.local/share/es.concellodebarreiros.saf/saf_database.db` |

---

## 7. Distribución

### 7.1 Compilación mediante GitHub Actions (Recomendado)

O repositorio inclúe unha GitHub Action que compila automaticamente a aplicación para **Windows, macOS e Linux**. Para usala:

1. **Fai fork do repositorio** na túa conta de GitHub

2. **Crea unha rama `release`**:
   ```bash
   git checkout -b release
   git push origin release
   ```

3. **Executa a acción manualmente**:
   - Vai á lapela "Actions" no teu repositorio de GitHub
   - Selecciona "Build Release"
   - Fai clic en "Run workflow"

4. **Descarga os executables**:
   - Cando a acción remate, vai a "Releases" ou "Artifacts"
   - Descarga os ficheiros para cada plataforma:
     - **Windows**: `.exe` ou `.msi`
     - **macOS Intel**: `.dmg` para procesadores Intel (amacOS 13 runner)
     - **macOS ARM**: `.dmg` para Apple Silicon (M1/M2/M3)
     - **Linux**: `.deb` ou `.AppImage` para x86_64

Esta é a forma máis sinxela de obter executables para todas as plataformas sen ter que configurar un entorno de desenvolvemento local.

### 7.2 Compilación Local

Para compilar localmente:

```bash
npm run tauri-build
```

O executable estará en:

| Sistema | Localización |
|---------|--------------|
| **Windows** | `src-tauri/target/release/bundle/msi/` ou `src-tauri/target/release/*.exe` |
| **macOS** | `src-tauri/target/release/bundle/dmg/` ou `src-tauri/target/release/bundle/macos/` |
| **Linux** | `src-tauri/target/release/bundle/deb/` ou `src-tauri/target/release/bundle/appimage/` |

**Nota**: Para compilar para macOS ARM desde un Mac Intel (ou viceversa), necesitas instalar o target adicional:
```bash
# Para compilar para Apple Silicon desde Intel
rustup target add aarch64-apple-darwin
npm run tauri-build -- --target aarch64-apple-darwin

# Para compilar para Intel desde Apple Silicon
rustup target add x86_64-apple-darwin
npm run tauri-build -- --target x86_64-apple-darwin
```

### 7.3 Asinar a Aplicación (Opcional)

Para evitar avisos de seguridade:

- **Windows**: Usa un certificado de código
- **macOS**: Usa un certificado de desenvolvedor de Apple

Consulta a documentación de Tauri para mais detalles.

---

## 8. Recursos Adicionais

### 8.1 Documentación Oficial

- **Tauri**: https://tauri.app/v1/guides/
- **Rust**: https://doc.rust-lang.org/book/
- **React**: https://react.dev/
- **SQLite**: https://www.sqlite.org/docs.html

### 8.2 Cando Pedir Axuda

Se te atopas con problemas que non podes resolver:

1. Busca na documentación oficial
2. Busca en Google co erro específico
3. Pregunta a OpenCode cunha descrición detallada do problema
4. Consulta cos colegas desenvolvedores

---

## 9. Checklist de Compilación

Antes de distribuír a aplicación, verifica:

- [ ] `cargo check` non da erros
- [ ] `npm run build` non da erros
- [ ] A aplicación abre e funciona correctamente en Windows
- [ ] A aplicación abre e funciona correctamente en macOS (opcional)
- [ ] A aplicación abre e funciona correctamente en Linux (opcional)
- [ ] Os backups créanse correctamente
- [ ] A exportación a Excel funciona
- [ ] A exportación a PDF funciona
- [ ] A base de datos gárdase na localización correcta
- [ ] O ficheiro `.lock` elimínase ao pechar a aplicación

---

*Manual de Desenvolvemento - SAF Barreiros v1.0*
*Última actualización: Febreiro 2026*