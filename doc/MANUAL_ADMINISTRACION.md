# Manual de Administración - SAF Barreiros

## Introdución

Este manual está dirixido ás persoas responsables de administrar a aplicación SAF (Servizo de Axuda ao Fogar) do Concello de Barreiros. Aquí atoparás toda a información necesaria para instalar, manter e resolver problemas da aplicación.

---

## 1. Instalación da Aplicación

### 1.1 Requisitos do Sistema

A aplicación funciona en:
- **Windows**: Windows 10 ou superior (64 bits)

### 1.2 Despregamento

A aplicación é un **executable independente (standalone)** que non require instalación. Simplemente:

1. **Coloca o ficheiro `saf-barreiros-app.exe` nunha localización de rede** accesible para todos os usuarios (por exemplo: `\\SERVIDOR\Aplicacions\SAF\`)

2. **Crea un atallo** nos ordenadores dos usuarios que apunte a esa localización

É todo! A aplicación pode executarse directamente desde calquera localización.

### 1.3 Datos da Aplicación

**Na primeira execución**, a aplicación preguntarche onde queres gardar os datos:

- **Localización recomendada**: Unha carpeta compartida na rede (por exemplo: `\\SERVIDOR\SAF_Datos`)
- Se vais usar varios ordenadores conectados en rede: todos deben usar a mesma carpeta compartida

**Importante**: Unha vez configurada a carpeta compartida, todos os ordenadores usaran a mesma base de datos.

---

## 2. A Base de Datos

### 2.1 Que é a Base de Datos?

A aplicación garda toda a información (usuarios, artigos, préstamos) nunha base de datos SQLite. Esta base de datos é un **único ficheiro** con extensión `.db`.

### 2.2 Onde está a Base de Datos?

Por defecto, a base de datos gárdase en:

| Sistema | Localización |
|---------|--------------|
| Windows | `C:\Users\[Usuario]\AppData\Local\saf-barreiros-app\saf_database.db` |
| macOS | `~/Library/Application Support/saf-barreiros-app/saf_database.db` |
| Linux | `~/.local/share/saf-barreiros-app/saf_database.db` |

Se configuraches unha carpeta personalizada, a base de datos estará nesa carpeta.

### 2.3 Copia de Seguridade Manual (Moi Importante!)

**Recomendación**: Fai unha copia de seguridade da base de datos **cada día**.

#### Como facer backup manual:

1. **Pecha a aplicación** completamente (verifica que non estea executándose)

2. **Localiza o ficheiro** `saf_database.db`

3. **Copia o ficheiro** a un lugar seguro:
   - Unha unidade USB
   - Unha carpeta na nube (Google Drive, OneDrive, Dropbox)
   - Un servidor de backups da organización

4. **Nomea a copia** coa data, por exemplo: `saf_database_backup_2025-03-15.db`

#### Que ficheiros copiar?

| Ficheiro | Descripción | Copialo? |
|----------|-------------|----------|
| `saf_database.db` | Base de datos principal | **SI, obrigatorio** |
| `settings.json` | Configuración da app | Recomendado |
| `backups/` | Carpeta con backups automáticos | Opcional |

### 2.4 Restaurar un Backup Manual

Se perdesche datos e tes unha copia de seguridade manual:

1. **Pecha a aplicación**
2. **Localiza o ficheiro de backup** (por exemplo, nunha unidade USB)
3. **Copia o ficheiro** `saf_database.db` do backup á carpeta de datos da aplicación
4. **Sobrescribe o ficheiro existente** se o sistema o pide
5. **Abre a aplicación** e verifica que os datos están correctos

---

## 3. Sistema de Backup Interno

### 3.1 Que é o Backup Interno?

A aplicación ten un sistema de backup integrado que crea copias de seguridade automáticamente.

### 3.2 Como Funciona

Cando fas clic en **"Crear Backup"** desde a aplicación:

1. A aplicación crea un ficheiro ZIP coa base de datos
2. O ficheiro noméase automaticamente coa data e hora: `saf_backup_20250315_143022.zip`
3. Gárdase na carpeta `backups/` dentro do directorio de datos

### 3.3 Onde están os Backups Internos?

Os backups créanse en:

- **Windows**: `C:\Users\[Usuario]\AppData\Local\saf-barreiros-app\backups\`
- **macOS**: `~/Library/Application Support/saf-barreiros-app/backups/`
- **Linux**: `~/.local/share/saf-barreiros-app/backups/`

### 3.4 Restaurar un Backup Interno

Para restaurar un backup creado pola aplicación:

1. Abre a aplicación
2. Vai a **"Sistema" → "Backup e Restauración"**
3. Verás unha lista de todos os backups dispoñibles
4. Selecciona o backup que queiras restaurar
5. Fai clic en **"Restaurar"**
6. Confirma a acción

**Que pasa durante a restauración?**

1. A aplicación fai unha copia de seguridade da base de datos actual (por se acaso)
2. Extrae a base de datos do ficheiro ZIP seleccionado
3. Substitúe a base de datos actual
4. A aplicación recárgase cos datos restaurados

### 3.5 Relación entre Backup Manual e Interno

| Tipo | Cando usalo | Onde está |
|------|-------------|-----------|
| **Manual** | Backup diario, gardar en lugar externo (USB, nube) | Onde ti decidas |
| **Interno** | Antes de facer cambios importantes, para desfacer cambios | Carpeta da aplicación |

**Recomendación**: Usa os dous sistemas:
- **Backup interno**: antes de facer cambios grandes na aplicación
- **Backup manual**: cada día ao finalizar a xornada

---

## 4. Resolución de Problemas

### 4.1 A Aplicación Non Inicia

**Síntomas**: Ao facer clic na aplicación, non abre ou pecha inmediatamente.

**Posibles causas e solucións**:

1. **Ficheiro de bloqueo activo**:
   - Busca o ficheiro `saf_database.lock` na carpeta de datos
   - Se a aplicación está pechada, elimina este ficheiro
   - Tenta abrir a aplicación de novo

2. **Permisos insuficientes**:
   - Verifica que tes permisos de escritura na carpeta de datos
   - En Windows: clic dereito na carpeta → Propiedades → Seguridade
   - En macOS/Linux: usa `chmod` para dar permisos

3. **Base de datos danada**:
   - Intenta restaurar un backup recente
   - Se non tes backup, contacta con soporte técnico

### 4.2 Mensaxe "Base de Datos Bloqueada"

**Síntomas**: A aplicación mostra un erro dicindo que a base de datos está bloqueada.

**Causa**: Outro usuario está usando a aplicación no mesmo momento.

**Solución**:
1. Agarda uns segundos e tenta de novo
2. Se o problema persiste, verifica que ninguén máis estea usando a aplicación
3. Se ninguén a está a usar, elimina o ficheiro `.lock`

### 4.3 Non Podo Acceder aos Datos (Carpeta en Rede)

**Síntomas**: A aplicación non consegue abrir a base de datos nunha carpeta compartida.

**Solucións**:

1. **Verifica a conexión á rede**:
   - Podes acceder á carpeta desde o explorador de ficheiros?
   - Tes os permisos correctos?

2. **Comproba que non está en uso**:
   - Pecha a aplicación en todos os ordenadores
   - Agarda 30 segundos
   - Tenta abrir de novo

3. **Elimina o ficheiro de bloqueo**:
   - Busca `saf_database.lock` na carpeta compartida
   - Elimina o ficheiro
   - Reinicia a aplicación

### 4.4 Os Datos Non Se Gardan

**Síntomas**: Fai cambios pero ao reiniciar, os datos non están.

**Posibles causas**:

1. **Usando a base de datos equivocada**:
   - Verifica a localización da base de datos en "Configuración"
   - Comproba que estás a usar a carpeta correcta

2. **Problemas de permisos**:
   - A aplicación non pode escribir na carpeta
   - Verifica os permisos da carpeta

3. **Espazo en disco insuficiente**:
   - Comproba que tes espazo libre no disco

### 4.5 Perdín Todos os Datos

**Que facer**:

1. **Non entren en pánico** - probablemente sexa recuperable

2. **Busca backups**:
   - Revisa a carpeta `backups/` da aplicación
   - Revisa os teus backups manuais (USB, nube)
   - Busca ficheiros con extensión `.backup.XXXXXX` na carpeta de datos

3. **Restaura o backup máis recente**:
   - Usa a función de restauración da aplicación
   - Ou copia manualmente o ficheiro de backup

### 4.6 Erro ao Exportar a Excel ou PDF

**Síntomas**: Ao tentar exportar, aparece un erro.

**Solucións**:

1. **Verifica a carpeta de destino**:
   - Tes permisos para escribir nesa carpeta?
   - A carpeta existe?

2. **Espazo en disco**:
   - Comproba que tes espazo suficiente

3. **Ruta con caracteres especiais**:
   - Evita carpetas con caracteres especiais (ñ, acentos, espazos)
   - Usa rutas simples como `C:\Informes\` ou `C:\Usuarios\Documentos\`

---

## 5. Mantemento Recomendado

### 5.1 Tarefas Diarias

- [ ] Facer backup manual ao finalizar a xornada
- [ ] Verificar que a aplicación funciona correctamente

### 5.2 Tarefas Semanais

- [ ] Revisar os backups internos e eliminar os máis antigos (manter os últimos 10)
- [ ] Verificar o espazo en disco dispoñible

### 5.3 Tarefas Mensais

- [ ] Comprobar que os backups externos (USB, nube) están actualizados
- [ ] Revisar o rexistro de eventos na aplicación para detectar problemas

---

## 6. Información de Contacto

Se tes problemas que non podes resolver:

1. **Revisa este manual** completamente
2. **Busca nas preguntas frecuentes** (sección anterior)
3. **Contacta co equipo de soporte técnico** do Concello de Barreiros

---

## Apéndice: Estrutura de Ficheiros

```
saf-barreiros-app/
├── saf_database.db          ← Base de datos principal (COPIAR ESTE!)
├── saf_database.lock        ← Ficheiro de bloqueo (automático, non copiar)
├── settings.json            ← Configuración da aplicación
└── backups/                 ← Carpeta de backups internos
    ├── saf_backup_20250315_100000.zip
    ├── saf_backup_20250314_153000.zip
    └── ...
```

---

*Manual de Administración - SAF Barreiros v1.0*
*Última actualización: Febreiro 2025*