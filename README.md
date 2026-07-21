# FitTracker 💪

App web personal de seguimiento fitness: peso, medidas, entrenamientos, nutrición,
rutina de 12 semanas, plan de comida con recetas, lista de compras y logros.

- **Frontend:** HTML + CSS + JavaScript vanilla + Chart.js (tema oscuro/negro, responsive para móvil).
- **Backend:** Flask (Python) con API REST.
- **Base de datos:** SQLite (`data/fittracker.db`), con migración automática desde CSV.

## Correr en local
```bash
pip install -r requirements.txt
python server.py
```
Abre http://localhost:3000 (o desde otro dispositivo en la misma red: `http://IP-DE-TU-PC:3000`).

## Desplegar gratis (PC apagada, acceso desde el celular)
Ver la guía paso a paso: [DEPLOY_PYTHONANYWHERE.md](DEPLOY_PYTHONANYWHERE.md).

## Estructura
| Archivo | Descripción |
|---------|-------------|
| `server.py` | Servidor Flask + API REST + SQLite |
| `index.html` | Estructura de la app (SPA) |
| `app.js` | Lógica, gráficas y render de vistas |
| `styles.css` | Estilos (tema oscuro + responsive) |
| `requirements.txt` | Dependencias Python |
