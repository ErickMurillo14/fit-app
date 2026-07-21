from flask import Flask, jsonify, request, send_from_directory
import sqlite3, os, csv

app = Flask(__name__, static_folder='.', static_url_path='')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)
# Permite fijar la ruta de la DB por variable de entorno (útil en hosting con disco persistente)
DB_PATH = os.environ.get('DB_PATH', os.path.join(DATA_DIR, 'fittracker.db'))

TABLES = {
    'pesos': ['fecha', 'peso', 'momento', 'nota', 'bmi'],
    'medidas': ['fecha', 'cintura', 'cadera', 'pecho', 'brazo', 'muslo'],
    'ejercicios': ['fecha', 'tipo', 'duracion', 'intensidad', 'calorias', 'distancia', 'nota'],
    'nutricion': ['fecha', 'kcal', 'proteina', 'carbs', 'grasas', 'agua', 'nota'],
}


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def cols_sql(table):
    return ', '.join(f'"{c}"' for c in TABLES[table])


def insert_row(conn, table, row):
    cols = TABLES[table]
    placeholders = ', '.join('?' for _ in cols)
    values = ['' if row.get(c) is None else str(row.get(c)) for c in cols]
    conn.execute(f'INSERT INTO "{table}" ({cols_sql(table)}) VALUES ({placeholders})', values)


def ordered_ids(conn, table):
    # Orden estable: por fecha y luego por id de inserción (replica el CSV ordenado por fecha)
    return [r[0] for r in conn.execute(f'SELECT id FROM "{table}" ORDER BY fecha, id').fetchall()]


def migrate_csv(conn):
    """Importa una sola vez los datos de los CSV antiguos (si la tabla está vacía)."""
    for table in TABLES:
        count = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
        if count:
            continue
        path = os.path.join(DATA_DIR, f'{table}.csv')
        if not os.path.exists(path):
            continue
        with open(path, 'r', newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                if any((r.get(c) or '').strip() for c in TABLES[table]):
                    insert_row(conn, table, r)
    conn.commit()


def init_db():
    conn = get_db()
    for table in TABLES:
        col_defs = ', '.join(f'"{c}" TEXT' for c in TABLES[table])
        conn.execute(
            f'CREATE TABLE IF NOT EXISTS "{table}" '
            f'(id INTEGER PRIMARY KEY AUTOINCREMENT, {col_defs})'
        )
    conn.commit()
    migrate_csv(conn)
    conn.close()


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/data')
def get_data():
    conn = get_db()
    out = {}
    for table in TABLES:
        rows = conn.execute(
            f'SELECT {cols_sql(table)} FROM "{table}" ORDER BY fecha, id'
        ).fetchall()
        out[table] = [{c: r[c] for c in TABLES[table]} for r in rows]
    conn.close()
    return jsonify(out)


@app.route('/api/<table>', methods=['POST'])
def add_row(table):
    if table not in TABLES:
        return jsonify({'error': 'unknown table'}), 404
    conn = get_db()
    insert_row(conn, table, request.get_json() or {})
    conn.commit()
    count = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
    conn.close()
    return jsonify({'ok': True, 'count': count})


@app.route('/api/<table>/<int:idx>', methods=['DELETE'])
def del_row(table, idx):
    if table not in TABLES:
        return jsonify({'error': 'unknown table'}), 404
    conn = get_db()
    ids = ordered_ids(conn, table)
    if 0 <= idx < len(ids):
        conn.execute(f'DELETE FROM "{table}" WHERE id = ?', (ids[idx],))
        conn.commit()
    count = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
    conn.close()
    return jsonify({'ok': True, 'count': count})


# Inicializa la base de datos al importar el módulo (funciona con `python server.py` y con gunicorn)
init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)
