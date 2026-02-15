# 📘 Guía de Instalación e Despregamento - SAF Barreiros

## 🎯 Resumo

Aplicación completa para xestionar préstamos do Servizo de Axuda ao Fogar (SAF) do Concello de Barreiros. 

**Características principais:**
- ✅ Funciona en Windows, macOS e Linux
- ✅ Base de datos SQLite (ficheiro único)
- ✅ Interface moderna e intuitiva en galego
- ✅ Sistema de Event Sourcing (rexistro completo)
- ✅ Exportación a Excel
- ✅ Backups automáticos
- ✅ Acceso dende varios equipos (carpeta compartida)

---

## 📋 Requisitos

### Para desenvolver (compilar a aplicación)

1. **Node.js** (v18 ou superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **Rust** (última versión estable)
   - Instalar en macOS/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Instalar en Windows: Descargar desde https://rustup.rs/
   - Verificar instalación: `rustc --version`

3. **Tauri CLI**
   - Instalar: `cargo install tauri-cli`

### Para usuarios finais (só instalar)

- Calquera sistema operativo moderno (Windows 10+, macOS 10.13+, Linux)
- Non require instalación de dependencias adicionais

---

## 🚀 Instalación Rápida

### Opción 1: Usar os binarios pre-compilados (RECOMENDADO para usuarios)

1. Descarga o paquete correspondente ao teu sistema:
   - **Windows**: `SAF-Barreiros_1.0.0_x64-setup.exe`
   - **macOS**: `SAF-Barreiros_1.0.0_x64.dmg`
   - **Linux**: `saf-barreiros_1.0.0_amd64.deb` (Ubuntu/Debian) ou `SAF-Barreiros-1.0.0-x86_64.AppImage`

2. Executa o instalador e segue as instrucións

3. **IMPORTANTE**: Na primeira execución, selecciona onde queres gardar a base de datos:
   - Se é só para ti: Deixa a opción por defecto
   - Se queres compartir con outros equipos: Selecciona unha carpeta compartida da rede

### Opción 2: Compilar desde o código fonte (para desenvolvedores)

```bash
# 1. Clonar ou descargar o proxecto
cd saf-tauri-app

# 2. Instalar dependencias de Node
npm install

# 3. Compilar a aplicación
npm run tauri-build

# 4. O instalador estará en:
#    - Windows: src-tauri/target/release/bundle/msi/
#    - macOS: src-tauri/target/release/bundle/dmg/
#    - Linux: src-tauri/target/release/bundle/deb/
```

---

## ⚙️ Configuración

### Cambiar a localización da base de datos

1. Abre a aplicación
2. Vai a "Sistema" → "Configuración"
3. Selecciona "Cambiar localización da base de datos"
4. Escolle a nova carpeta

**Nota**: Se cambias a localización, a app reiniciarase e usará a nova base de datos (se existe) ou creará unha nova.

### Configurar acceso dende varios equipos

**Escenario típico**: Un ordenador principal e varios secundarios que acceden aos mesmos datos.

1. **No ordenador principal**:
   - Instala a aplicación
   - Na primeira execución, crea unha carpeta compartida (ex: `\\Servidor\SAF_Datos`)
   - Selecciona esa carpeta como localización da base de datos

2. **Nos demais ordenadores**:
   - Instala a aplicación
   - Na primeira execución, selecciona a mesma carpeta compartida
   - A app detectará a base de datos existente e usaráa

**Nota sobre bloqueos**: Se dous usuarios intentan modificar datos ao mesmo tempo, o segundo agardará automaticamente (máximo 30 segundos).

---

## 📊 Uso Básico

### Crear un novo préstamo

1. Fai clic en "Novo Préstamo" ou no botón (+) no Panel de Control
2. Busca e selecciona o usuario (ou crea un novo)
3. Selecciona os artigos a prestar
4. Confirma as datas e gardar

### Rexistrar unha devolución

1. Vai a "Préstamos"
2. Busca o préstamo activo
3. Fai clic no botón verde (✓) na columna "Accións"
4. Confirma a devolución

### Exportar a Excel

1. Vai a "Informes"
2. Selecciona o tipo de informe
3. Fai clic en "Exportar Excel"
4. Escolle onde gardar o ficheiro

### Crear un backup

1. Vai a "Backup e Exportar"
2. Fai clic en "Crear Backup Agora"
3. O backup gárdase automaticamente na carpeta de backups

---

## 🔧 Solución de Problemas

### A aplicación non inicia

1. Verifica que tes permisos de escritura na carpeta da base de datos
2. Comproba que non hai outra instancia da app executándose (mira o ficheiro `.lock`)
3. Se o problema persiste, elimina o ficheiro `.lock` manualmente

### Non podo acceder á base de datos (carpeta compartida)

1. Verifica que tes acceso á carpeta compartida
2. Comproba que non está aberta noutro ordenador
3. Se queda "bloqueada", elimina o ficheiro `saf_database.lock` da carpeta

### Perdín datos

1. Busca na carpeta de backups (normalmente en `AppData/Local/saf-barreiros-app/backups`)
2. Vai a "Backup e Exportar" → "Restaurar Backup"
3. Selecciona o backup máis recente

### Erro "database is locked"

Isto ocorre cando outro usuario está usando a app. Agarda un momento e inténtao de novo. Se persiste:
1. Pecha a app en todos os ordenadores
2. Elimina o ficheiro `saf_database.lock`
3. Reinicia a app

---

## 📁 Estrutura de Ficheiros

### Datos da aplicación

Por defecto, os datos gárdanse en:

- **Windows**: `C:\Users\[Usuario]\AppData\Local\saf-barreiros-app\`
- **macOS**: `~/Library/Application Support/saf-barreiros-app/`
- **Linux**: `~/.local/share/saf-barreiros-app/`

### Ficheiros importantes

- `saf_database.db` - Base de datos principal (SQLite)
- `saf_database.lock` - Ficheiro de bloqueo (elímase automaticamente)
- `settings.json` - Configuración da app
- `backups/` - Carpeta con copias de seguridade

---

## 🔄 Actualizacións

Para actualizar a aplicación:

1. Descarga a nova versión
2. Instala sobre a versión anterior (os datos conservaranse)
3. A configuración mantense automaticamente

---

## 📞 Soporte

Se tes problemas ou necesitas axuda:

1. Revisa esta guía
2. Comproba os logs da aplicación (sección "Rexistro de Eventos")
3. Contacta co equipo de soporte do Concello de Barreiros

---

## 📝 Notas Técnicas

### Rendemento

- A base de datos SQLite soporta miles de rexistros sen problemas
- A app está optimizada para funcionar ben mesmo en equipos antigos
- O tempo de resposta é instantáneo para operacións normais

### Seguridade

- A base de datos é un ficheiro local (non se envía a ningún servidor)
- Podes copiar o ficheiro `.db` para facer backups manuais
- O sistema de eventos permite auditar todas as accións

### Compatibilidade

- Windows: 10 ou superior (64-bit)
- macOS: 10.13 ou superior (Intel e Apple Silicon)
- Linux: Ubuntu 18.04+, Debian 10+, Fedora 30+, etc.

---

## 🎉 Conclusión

A aplicación SAF Barreiros está deseñada para ser:
- **Fácil de usar**: Interface intuitiva sen necesidade de formación
- **Fiable**: Base de datos robusta con sistema de backups
- **Flexible**: Funciona en local ou en rede
- **Completa**: Xestión total de préstamos con rexistro de eventos

**Para comezar**: Instala a aplicación, selecciona onde gardar os datos, e comeza a usala!