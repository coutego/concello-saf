# Manual de Administración - SAF Barreiros

## Introdución

Este manual está dirixido ás persoas responsables de administrar a aplicación SAF (Servizo de Axuda ao Fogar) do Concello de Barreiros. Aquí atoparás toda a información necesaria para instalar, manter e resolver problemas da aplicación.

---

## 1. Instalación da Aplicación

### 1.1 Requisitos do Sistema

A aplicación funciona en:
- **Windows**: Windows 10 ou superior (64 bits)
- **macOS**: macOS 10.13 (High Sierra) ou superior (Intel e Apple Silicon)
- **Linux**: Ubuntu 20.04+, Debian 11+, ou distribucións equivalentes (x86_64)

### 1.2 Despregamento

A aplicación é un **executable independente (standalone)** que non require instalación.

#### Windows

1. **Coloca o ficheiro `.exe` ou `.msi` nunha localización de rede** accesible para todos os usuarios (por exemplo: `\\SERVIDOR\Aplicacions\SAF\`)
2. **Crea un atallo** nos ordenadores dos usuarios que apunte a esa localización

#### macOS

1. Abre o ficheiro `.dmg`
2. Arrastra a aplicación á carpeta Aplicacións
3. Na primeira execución, pode que necesites autorizar a aplicación en Preferencias do Sistema → Seguridade e Privacidade

#### Linux

1. Instala o paquete `.deb`:
   ```bash
   sudo dpkg -i saf_*.deb
   sudo apt-get install -f  # Para instalar dependencias
   ```
   Ou usa o `.AppImage` (non require instalación):
   ```bash
   chmod +x saf_*.AppImage
   ./saf_*.AppImage
   ```

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
| **Windows** | `C:\Users\[Usuario]\AppData\Local\es.concellodebarreiros.saf\saf_database.db` |
| **macOS** | `~/Library/Application Support/es.concellodebarreiros.saf/saf_database.db` |
| **Linux** | `~/.local/share/es.concellodebarreiros.saf/saf_database.db` |

Se configuraches unha carpeta personalizada na primeira execución, a base de datos estará nesa carpeta. Podes ver e cambiar a localización desde **Administración → Base de datos**.

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

## 3. Sistema de Copias de Seguridade

### 3.1 Copias de Seguridade Internas

A aplicación xestiona as copias de seguridade desde a sección **Administración → Copias de seguridade**.

#### Funcións dispoñibles:

| Acción | Descripción |
|--------|-------------|
| **Crear copia** | Crea unha nova copia de seguridade e gárdaa no directorio de backups da aplicación |
| **Exportar** | Garda unha copia nunha localización arbitraria (USB, disco de rede, nube) |
| **Restaurar** | Recupera os datos desde unha copia gardada (substitúe os datos actuais) |
| **Importar externa** | Importa unha copia de seguridade dende unha localización externa |
| **Eliminar** | Elimina unha copia de seguridade do sistema |

### 3.2 Onde están os Backups?

Os backups créanse en:

| Sistema | Localización |
|---------|--------------|
| **Windows** | `C:\Users\[Usuario]\AppData\Local\es.concellodebarreiros.saf\backups\` |
| **macOS** | `~/Library/Application Support/es.concellodebarreiros.saf/backups/` |
| **Linux** | `~/.local/share/es.concellodebarreiros.saf/backups/` |

Cada backup é un ficheiro ZIP co nome `saf_backup_YYYYMMDD_HHMMSS.zip`.

### 3.3 Como Crear unha Copia

1. Abre a aplicación
2. Vai a **Administración → Copias de seguridade**
3. Pulsa **"+ Crear copia"**
4. A copia aparecerá na lista coa data e hora

### 3.4 Como Exportar unha Copia a USB ou Rede

Para gardar unha copia nun dispositivo externo:

1. Na lista de copias, localiza a copia que queres exportar
2. Pulsa **"Exportar"**
3. Selecciona a localización de destino (por exemplo, a unidade USB)
4. O ficheiro copiarase nesa localización

### 3.5 Como Restaurar unha Copia

**⚠️ Atención**: Esta operación é destrutiva e substitúe todos os datos actuais.

1. Na lista de copias, localiza a copia que queres restaurar
2. Pulsa **"Restaurar"**
3. Confirma a acción no diálogo de advertencia
4. Pecha e volve abrir a aplicación para ver os datos restaurados

### 3.6 Como Importar unha Copia Externa

Se tes unha copia de seguridade gardada nun USB ou outra localización:

1. Pulsa **"Importar externa"**
2. Selecciona o ficheiro `.zip` da copia
3. A copia importarase e aparecerá na lista

### 3.7 Como Eliminar Copias Antigas

1. Na lista de copias, localiza a copia que queres eliminar
2. Pulsa **"Eliminar"**
3. Confirma a acción

**Recomendación**: Mantén as últimas 10 copias. Exporta as máis antigas a un USB antes de eliminalas se as queres conservar.

---

## 4. Resolución de Problemas

### 4.1 A Aplicación Non Inicia

**Síntomas**: Ao facer clic na aplicación, non abre ou pecha inmediatamente.

**Posibles causas e solucións**:

1. **Ficheiro de bloqueo activo** (raro, pero pode ocorrer se a aplicación se pechou de forma anormal):
   - Busca o ficheiro `saf_database.lock` na carpeta de datos
   - Se a aplicación está pechada, elimina este ficheiro
   - Tenta abrir a aplicación de novo
   - Nota: Normalmente o ficheiro `.lock` elimínase automáticamente ao pechar a aplicación

2. **Permisos insuficientes**:
   - **Windows**: clic dereito na carpeta → Propiedades → Seguridade
   - **macOS**: Usa "Obter información" na carpeta e verifica os permisos
   - **Linux**: Usa `chmod` para dar permisos: `chmod -R 755 ~/.local/share/es.concellodebarreiros.saf/`

3. **Base de datos danada**:
   - Intenta restaurar un backup recente
   - Se non tes backup, contacta con soporte técnico

4. **macOS: Aplicación non firmada**:
   - Ao abrir por primeira vez, vai a Preferencias do Sistema → Seguridade e Privacidade
   - Fai clic en "Abrir de todos modos" preto da mensaxe de seguridade
   - Ou executa desde o terminal: `xattr -cr /Applications/SAF.app`

5. **Linux: Dependencias faltantes**:
   - Executa: `sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev`

### 4.2 Mensaxe "Base de Datos Bloqueada"

**Síntomas**: A aplicación mostra un erro dicindo que a base de datos está bloqueada.

**Causa**: Outro usuario está usando a aplicación no mesmo momento.

**Solución**:
1. Agarda uns segundos e tenta de novo
2. Se o problema persiste, verifica que ninguén máis estea usando a aplicación
3. Se ninguén a está a usar e o problema continúa, elimina o ficheiro `.lock` da carpeta de datos

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
   - Verifica a localización da base de datos en **Administración → Base de datos**
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
   - Revisa a sección **Administración → Copias de seguridade**
   - Revisa os teus backups exportados (USB, nube)
   - Busca ficheiros con extensión `.backup.XXXXXX` na carpeta de datos

3. **Restaura o backup máis recente**:
   - Usa a función de restauración da aplicación
   - Ou importa un backup externo e restaura

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

- [ ] Facer unha copia de seguridade e exportala a unha unidade externa (USB, nube)
- [ ] Verificar que a aplicación funciona correctamente

### 5.2 Tarefas Semanais

- [ ] Revisar as copias de seguridade na aplicación e eliminar as máis antigas (manter as últimas 10)
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

### Windows

```
C:\Users\[Usuario]\AppData\Local\es.concellodebarreiros.saf\
├── saf_database.db          ← Base de datos principal
├── saf_database.lock        ← Ficheiro de bloqueo (automático, elimínase ao pechar)
├── settings.json            ← Configuración da aplicación
└── backups/                 ← Carpeta de copias de seguridade
    ├── saf_backup_20260215_100000.zip
    ├── saf_backup_20260214_153000.zip
    └── ...
```

### macOS

```
~/Library/Application Support/es.concellodebarreiros.saf/
├── saf_database.db          ← Base de datos principal
├── saf_database.lock        ← Ficheiro de bloqueo (automático, elimínase ao pechar)
├── settings.json            ← Configuración da aplicación
└── backups/                 ← Carpeta de copias de seguridade
    ├── saf_backup_20260215_100000.zip
    └── ...
```

### Linux

```
~/.local/share/es.concellodebarreiros.saf/
├── saf_database.db          ← Base de datos principal
├── saf_database.lock        ← Ficheiro de bloqueo (automático, elimínase ao pechar)
├── settings.json            ← Configuración da aplicación
└── backups/                 ← Carpeta de copias de seguridade
    ├── saf_backup_20260215_100000.zip
    └── ...
```

---

*Manual de Administración - SAF Barreiros v1.0*
*Última actualización: Febreiro 2026*