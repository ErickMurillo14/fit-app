from flask import Flask, jsonify, request, send_from_directory
import csv, os

app = Flask(__name__, static_folder='.', static_url_path='')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

TABLES = {
    'pesos': ['fecha', 'peso', 'momento', 'nota', 'bmi'],
    'medidas': ['fecha', 'cintura', 'cadera', 'pecho', 'brazo', 'muslo'],
    'ejercicios': ['fecha', 'tipo', 'duracion', 'intensidad', 'calorias', 'distancia', 'nota'],
    'nutricion': ['fecha', 'kcal', 'proteina', 'carbs', 'grasas', 'agua', 'nota'],
}


def csv_path(table):
    return os.path.join(DATA_DIR, f'{table}.csv')


def read_table(table):
    path = csv_path(table)
    if not os.path.exists(path):
        return []
    with open(path, 'r', newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def write_table(table, rows):
    with open(csv_path(table), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=TABLES[table])
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in TABLES[table]})


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/data')
def get_data():
    return jsonify({t: read_table(t) for t in TABLES})


@app.route('/api/<table>', methods=['POST'])
def add_row(table):
    if table not in TABLES:
        return jsonify({'error': 'unknown table'}), 404
    rows = read_table(table)
    rows.append(request.get_json() or {})
    rows.sort(key=lambda r: r.get('fecha', ''))
    write_table(table, rows)
    return jsonify({'ok': True, 'count': len(rows)})


@app.route('/api/<table>/<int:idx>', methods=['DELETE'])
def del_row(table, idx):
    if table not in TABLES:
        return jsonify({'error': 'unknown table'}), 404
    rows = read_table(table)
    if 0 <= idx < len(rows):
        del rows[idx]
        write_table(table, rows)
    return jsonify({'ok': True, 'count': len(rows)})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3000, debug=False)
