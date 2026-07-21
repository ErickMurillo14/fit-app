# Desplegar FitTracker gratis en PythonAnywhere

Objetivo: URL pública accesible desde el celular (con la PC apagada) y base de datos SQLite persistente.

## 1. Crear cuenta
- Entra a https://www.pythonanywhere.com y crea una cuenta **Beginner (gratis)**.
- No pide tarjeta de crédito.

## 2. Subir los archivos del proyecto
En el dashboard, pestaña **Files**:
- Crea una carpeta, por ejemplo `fit-app`.
- Sube estos 4 archivos dentro de `fit-app`:
  - `server.py`
  - `index.html`
  - `app.js`
  - `styles.css`
- (La carpeta `data/` se crea sola al arrancar. NO subas el `.db`; empezarás limpio.)

> Alternativa con GitHub: abre una consola **Bash** y `git clone <tu-repo>` en lugar de subir a mano.

## 3. Instalar Flask
Abre una consola **Bash** (pestaña *Consoles* → *Bash*) y ejecuta:
```
pip install --user flask
```
(gunicorn NO hace falta aquí: PythonAnywhere usa su propio servidor WSGI.)

## 4. Crear la Web App
Pestaña **Web** → **Add a new web app**:
1. Dominio: acepta `tuusuario.pythonanywhere.com`.
2. Framework: elige **Manual configuration** (¡no "Flask"!).
3. Versión de Python: la más nueva disponible (3.10+).

## 5. Apuntar el WSGI a la app
En la pestaña **Web**, sección *Code*, haz clic en el enlace del archivo **WSGI configuration file**
(algo como `/var/www/tuusuario_pythonanywhere_com_wsgi.py`).

Borra TODO su contenido y déjalo así (cambia `tuusuario` por tu usuario real):

```python
import sys

# Ruta a la carpeta donde subiste server.py
project_home = '/home/tuusuario/fit-app'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Importa el objeto Flask 'app' desde server.py
from server import app as application
```

Guarda (botón **Save**).

## 6. Recargar
Vuelve a la pestaña **Web** y pulsa el botón verde **Reload**.

Listo. Abre en el celular:
```
https://tuusuario.pythonanywhere.com
```

## Notas
- **Base de datos:** se guarda en `/home/tuusuario/fit-app/data/fittracker.db`. Es persistente: no se borra al recargar ni con el tiempo.
- **Mantener activa (gratis):** cada ~3 meses PythonAnywhere te enviará un email; entra y pulsa el botón "Run until 3 months from today" para mantenerla viva.
- **Backup de tus datos:** en *Files* puedes descargar `data/fittracker.db` cuando quieras.
- **Actualizar el código:** vuelve a subir el archivo cambiado y pulsa **Reload**.
