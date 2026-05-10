import csv
import re
import os
import tkinter as tk
from tkinter import filedialog, messagebox
from datetime import datetime


# ── Transformaciones ────────────────────────────────────────────────────────

renombrar = {
    "Vehículo":         "vehiculo",
    "Conductor":        "conductor",
    "Llave":            "llave",
    "LLave":            "llave",
    "Tipo":             "tipo",
    "Dia":              "dia",
    "Fecha":            "fecha",
    "Hora":             "hora",
    "Duracíon":         "duracion",
    "Duracion":         "duracion",
    "Duración":         "duracion",
    "Velocidad Máxima": "velocidad_maxima",
    "Metros":           "metros",
    "Km":               "km",
    "Zona":             "zona",
    "Sitio":            "sitio",
    "Latitud":          "latitud",
    "Longitud":         "longitud",
    "Proveedor":        "proveedor",
}

columnas_fecha     = {'fecha'}
columnas_hora      = {'hora'}
columnas_duracion  = {'duracion'}
columnas_numericas = {'velocidad_maxima', 'metros', 'km', 'latitud', 'longitud'}


def limpiar_numero(valor):
    v = valor.strip().replace(' ', '')
    if not v:
        return ''
    if '.' in v and ',' in v:
        v = v.replace('.', '').replace(',', '.')
    else:
        v = v.replace(',', '.')
    return v

def limpiar_fecha(valor):
    v = valor.strip()
    if not v:
        return ''
    for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(v, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return v

def limpiar_hora(valor):
    v = valor.strip()
    if not v:
        return ''
    partes = v.split(':')
    if len(partes) == 2:
        return f"{partes[0].zfill(2)}:{partes[1].zfill(2)}:00"
    if len(partes) == 3:
        return f"{partes[0].zfill(2)}:{partes[1].zfill(2)}:{partes[2].zfill(2)}"
    return v

def limpiar_duracion(valor):
    v = valor.strip()
    if not v:
        return ''
    if re.match(r'^\d{1,3}:\d{2}(:\d{2})?$', v):
        partes = v.split(':')
        if len(partes) == 2:
            return f"{partes[0].zfill(2)}:{partes[1].zfill(2)}:00"
        return f"{partes[0].zfill(2)}:{partes[1].zfill(2)}:{partes[2].zfill(2)}"
    m = re.match(r'^(\d+)\s*min', v, re.IGNORECASE)
    if m:
        h, mn = divmod(int(m.group(1)), 60)
        return f"{h:02d}:{mn:02d}:00"
    m = re.match(r'(\d+)\s*h\s*(\d*)\s*m?', v, re.IGNORECASE)
    if m:
        h  = int(m.group(1))
        mn = int(m.group(2)) if m.group(2) else 0
        return f"{h:02d}:{mn:02d}:00"
    return v


UMBRAL_ACTIVIDAD_MIN = 20  # minutos mínimos entre dos ACTIVIDAD del mismo vehículo/fecha


def _parse_tiempo(fecha, hora):
    """Convierte fecha YYYY-MM-DD y hora HH:MM:SS a datetime, o None si falla."""
    try:
        return datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def es_duplicado_actividad(fila, ultimas_actividades):
    """
    Devuelve True si la fila es ACTIVIDAD y ya existe una del mismo
    vehículo+fecha a menos de UMBRAL_ACTIVIDAD_MIN minutos.
    Actualiza ultimas_actividades con la hora más reciente.
    """
    if fila.get('tipo', '').strip().upper() != 'ACTIVIDAD':
        return False

    clave = (fila.get('vehiculo', ''), fila.get('fecha', ''))
    t = _parse_tiempo(fila.get('fecha', ''), fila.get('hora', ''))
    if t is None:
        return False

    ultima = ultimas_actividades.get(clave)
    if ultima is not None:
        diff = abs((t - ultima).total_seconds()) / 60
        if diff < UMBRAL_ACTIVIDAD_MIN:
            return True  # descartar, no actualizar la referencia

    ultimas_actividades[clave] = t
    return False


def procesar(input_file, output_file, log):
    with open(input_file, newline='', encoding='utf-8-sig') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:

        muestra = infile.read(4096)
        infile.seek(0)
        delimiter = '\t' if muestra.count('\t') > muestra.count(';') else (
                    ';'  if muestra.count(';') > muestra.count(',') else ',')

        reader  = csv.DictReader(infile, delimiter=delimiter)
        headers = [renombrar.get(col.strip(), col.strip()) for col in reader.fieldnames]
        writer  = csv.DictWriter(outfile, fieldnames=headers)
        writer.writeheader()

        filas = 0
        descartadas = 0
        ultimas_actividades = {}

        for row in reader:
            fila_limpia = {}
            for key, value in row.items():
                col = renombrar.get(key.strip(), key.strip())
                v   = value.strip() if value else ''
                if col in columnas_fecha:
                    fila_limpia[col] = limpiar_fecha(v)
                elif col in columnas_hora:
                    fila_limpia[col] = limpiar_hora(v)
                elif col in columnas_duracion:
                    fila_limpia[col] = limpiar_duracion(v)
                elif col in columnas_numericas:
                    fila_limpia[col] = limpiar_numero(v)
                else:
                    fila_limpia[col] = v

            if es_duplicado_actividad(fila_limpia, ultimas_actividades):
                descartadas += 1
                continue

            writer.writerow(fila_limpia)
            filas += 1

    log(f"✓ {filas} filas escritas, {descartadas} ACTIVIDAD duplicadas descartadas  →  {os.path.basename(output_file)}")


# ── Interfaz ────────────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Satelitrack — Limpieza CSV")
        self.resizable(False, False)
        self._build()

    def _build(self):
        pad = dict(padx=12, pady=6)

        # Archivo de entrada
        tk.Label(self, text="Archivo de entrada:").grid(row=0, column=0, sticky='w', **pad)
        self.entrada_var = tk.StringVar()
        tk.Entry(self, textvariable=self.entrada_var, width=52, state='readonly').grid(row=0, column=1, **pad)
        tk.Button(self, text="Seleccionar…", command=self._elegir_entrada).grid(row=0, column=2, **pad)

        # Archivo de salida
        tk.Label(self, text="Archivo de salida:").grid(row=1, column=0, sticky='w', **pad)
        self.salida_var = tk.StringVar()
        tk.Entry(self, textvariable=self.salida_var, width=52).grid(row=1, column=1, **pad)
        tk.Button(self, text="Guardar como…", command=self._elegir_salida).grid(row=1, column=2, **pad)

        # Botón procesar
        self.btn = tk.Button(self, text="Procesar", width=20,
                             bg="#2563eb", fg="white", font=("Segoe UI", 10, "bold"),
                             command=self._procesar)
        self.btn.grid(row=2, column=0, columnspan=3, pady=10)

        # Log
        self.log_text = tk.Text(self, height=6, width=72, state='disabled',
                                font=("Consolas", 9), bg="#f1f5f9")
        self.log_text.grid(row=3, column=0, columnspan=3, padx=12, pady=(0, 12))

    def _elegir_entrada(self):
        path = filedialog.askopenfilename(
            title="Seleccionar archivo CSV",
            filetypes=[("CSV / TSV", "*.csv *.tsv *.txt"), ("Todos", "*.*")]
        )
        if path:
            self.entrada_var.set(path)
            # Proponer nombre de salida automáticamente
            base, _ = os.path.splitext(path)
            self.salida_var.set(base + "_limpio.csv")

    def _elegir_salida(self):
        path = filedialog.asksaveasfilename(
            title="Guardar CSV limpio como…",
            defaultextension=".csv",
            filetypes=[("CSV", "*.csv")]
        )
        if path:
            self.salida_var.set(path)

    def _log(self, msg):
        self.log_text.config(state='normal')
        self.log_text.insert('end', msg + "\n")
        self.log_text.see('end')
        self.log_text.config(state='disabled')

    def _procesar(self):
        entrada = self.entrada_var.get().strip()
        salida  = self.salida_var.get().strip()
        if not entrada:
            messagebox.showwarning("Falta archivo", "Seleccioná el archivo de entrada.")
            return
        if not salida:
            messagebox.showwarning("Falta destino", "Indicá dónde guardar el archivo de salida.")
            return
        try:
            self.btn.config(state='disabled', text="Procesando…")
            self.update()
            procesar(entrada, salida, self._log)
            messagebox.showinfo("Listo", f"Archivo generado:\n{salida}")
        except Exception as e:
            messagebox.showerror("Error", str(e))
            self._log(f"✗ Error: {e}")
        finally:
            self.btn.config(state='normal', text="Procesar")


if __name__ == "__main__":
    App().mainloop()
