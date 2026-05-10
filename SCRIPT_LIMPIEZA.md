# Script de limpieza CSV — `script_limpieza.py`

## Para qué sirve
Herramienta de escritorio (Python + Tkinter) que toma un CSV exportado desde el sistema GPS Microtrack y lo convierte a un CSV limpio, listo para importar a Supabase (`registros_vehiculos`).

## Cómo usarlo
```
python script_limpieza.py
```
Abre una ventana donde:
1. Seleccionás el CSV de entrada (exportado del GPS)
2. Elegís dónde guardar el CSV limpio (por defecto sugiere `nombre_limpio.csv`)
3. Hacés clic en **Procesar**

## Qué hace por dentro

### 1. Detecta el separador automáticamente
Prueba tab `\t`, punto y coma `;` y coma `,` — usa el que más aparece en los primeros 4096 bytes.

### 2. Renombra columnas
Traduce los encabezados del CSV original al nombre exacto de las columnas de Supabase:

| CSV original | Columna Supabase |
|---|---|
| `Vehículo` | `vehiculo` |
| `Conductor` | `conductor` |
| `Llave` / `LLave` | `llave` |
| `Tipo` | `tipo` |
| `Dia` | `dia` |
| `Fecha` | `fecha` |
| `Hora` | `hora` |
| `Duracíon` / `Duracion` / `Duración` | `duracion` |
| `Velocidad Máxima` | `velocidad_maxima` |
| `Metros` | `metros` |
| `Km` | `km` |
| `Zona` | `zona` |
| `Sitio` | `sitio` |
| `Latitud` | `latitud` |
| `Longitud` | `longitud` |
| `Proveedor` | `proveedor` |

### 3. Limpia cada tipo de dato

**Fechas** (`fecha`) — normaliza a `YYYY-MM-DD`:
- Acepta: `31/05/2026`, `31-05-2026`, `2026-05-31`

**Horas** (`hora`) — normaliza a `HH:MM:SS`:
- `7:5` → `07:05:00`
- `14:30` → `14:30:00`

**Duración** (`duracion`) — normaliza a `HH:MM:SS`:
- `1:30` → `01:30:00`
- `90 min` → `01:30:00`
- `1h 30m` → `01:30:00`

**Números** (`velocidad_maxima`, `metros`, `km`, `latitud`, `longitud`):
- Elimina espacios
- Convierte coma decimal a punto: `1.234,56` → `1234.56`, `1,5` → `1.5`

### 4. Elimina duplicados de ACTIVIDAD
**Problema:** el GPS a veces genera múltiples eventos `ACTIVIDAD` seguidos para el mismo vehículo en el mismo día con pocos segundos de diferencia (duplicados).

**Solución:** si dos eventos `ACTIVIDAD` del mismo `vehiculo + fecha` están separados por menos de **20 minutos**, el segundo se descarta.

El log al final indica cuántos se descartaron: `✓ 1250 filas escritas, 38 ACTIVIDAD duplicadas descartadas`.

## Flujo completo de carga de datos
```
GPS Microtrack
    ↓ exportar CSV
script_limpieza.py
    ↓ CSV limpio
Supabase (import CSV en Table Editor)
    ↓
App Satelitrack (lee registros_vehiculos)
```

## Notas
- El script NO sube a Supabase — genera un CSV limpio que se importa manualmente desde el Table Editor de Supabase
- El umbral de 20 minutos para duplicados de ACTIVIDAD está en la constante `UMBRAL_ACTIVIDAD_MIN = 20` (línea 92)
- Soporta archivos con BOM (Excel en Windows exporta con `utf-8-sig`)
