from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import date

# Tworzymy aplikację Flask
app = Flask(__name__)

# === Inicjalizacja bazy danych SQLite ===
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS leki (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nazwa TEXT NOT NULL,
            dawka TEXT,
            godzina TEXT,
            ilosc INTEGER,
            data_start TEXT NOT NULL,
            data_end TEXT NOT NULL,
            kolor TEXT
        )
    ''')
    conn.commit()
    conn.close()

# === Główna strona frontendowa ===
@app.route('/')
def index():
    return render_template('index.html')  # Flask automatycznie szuka w folderze `templates`

# === API do obsługi leków ===
@app.route('/api/leki', methods=['GET', 'POST', 'DELETE'])
def leki():
    if request.method == 'POST':
        data = request.json
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute(
            '''INSERT INTO leki (nazwa, dawka, godzina, ilosc, data_start, data_end, kolor)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (
                data['nazwa'],
                data.get('dawka', ''),
                data.get('godzina', ''),
                data.get('ilosc', 0),
                data['data_start'],
                data['data_end'],
                data.get('kolor', '#2196f3')
            )
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "ok"})

    elif request.method == 'GET':
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("SELECT * FROM leki")
        rows = c.fetchall()
        conn.close()
        return jsonify([
            {
                "id": row[0],
                "nazwa": row[1],
                "dawka": row[2],
                "godzina": row[3],
                "ilosc": row[4],
                "data_start": row[5],
                "data_end": row[6],
                "kolor": row[7]
            } for row in rows
        ])

    elif request.method == 'DELETE':
        data = request.json
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("DELETE FROM leki WHERE id = ?", (data['id'],))
        conn.commit()
        conn.close()
        return jsonify({"status": "deleted"})

# === Uruchomienie serwera ===
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
