# Reglas de negocio — Viajes GPS (Satelitrack / Ribeiro SRL)

## Fuente de datos
- Tabla única: `registros_vehiculos` en Supabase
- Proveedor GPS: Microtrack
- Cada fila = un evento GPS

## Columnas clave
| Columna | Tipo | Descripción |
|---|---|---|
| `vehiculo` | TEXT | Patente del vehículo (ej: `AF296EA`) |
| `conductor` | TEXT | Nombre del conductor O ID de dispositivo (ver abajo) |
| `llave` | TEXT | ID interno del dispositivo GPS |
| `tipo` | TEXT | Tipo de evento (ver tabla abajo) |
| `fecha` | DATE | Fecha del evento (`2026-05-01`) |
| `hora` | TIME | Hora del evento (`07:24:05`) |
| `duracion` | INTERVAL | Duración del evento (`00:01:24`) |
| `velocidad_maxima` | NUMERIC | Vel. máxima registrada en el evento (km/h) |
| `metros` | NUMERIC | Metros recorridos en este evento |
| `km` | NUMERIC | Km recorridos en este evento (acumulado del tramo) |
| `zona` | TEXT | Descripción de zona GPS (ej: `(UB45) Zona Añelo`) |
| `sitio` | TEXT | Nombre del lugar (`N/A` si no hay) |
| `latitud` | FLOAT | Latitud GPS |
| `longitud` | FLOAT | Longitud GPS |

## Tipos de evento (`tipo`)
| Valor | Significado |
|---|---|
| `IDE Alta` | **Encendido del vehículo** — marca el inicio de un viaje |
| `IDE Baja` | **Apagado del vehículo** — marca el fin de un viaje |
| `ACTIVIDAD` | Tramo en movimiento — porta `km` y `velocidad_maxima` del tramo |
| `PARADA` | El vehículo se detuvo con motor encendido |
| `Exceso Vel.` | Se superó el límite de velocidad configurado |
| `Zona` | El vehículo entró/salió de una zona geográfica definida |

## Cómo identificar un conductor válido
La columna `conductor` a veces contiene el **ID del dispositivo** en lugar del nombre:
- Inválido: empieza con `NID-` → ej: `NID-AF296EA`
- Inválido: string hexadecimal puro ≥ 10 chars → ej: `0000014E2F67`
- Válido: nombre real → ej: `Monsalves Nadia`, `Muñoz Lorena`

## Reglas para construir un viaje
1. Un viaje = **IDE Alta** + eventos intermedios + **IDE Baja** del mismo vehículo
2. **Siempre dentro del mismo día** — un viaje nunca cruza la medianoche
3. El IDE Alta y el IDE Baja pueden tener `conductor = NID-*` (el dispositivo los registra); los eventos ACTIVIDAD tienen el nombre real del conductor
4. El orden correcto es: buscar por `fecha` ASC + `hora` ASC

### Algoritmo de agrupación
```
Para cada evento ordenado por fecha+hora ASC:
  Si tipo == "IDE Alta":
    diaInicio = fecha del IDE Alta
    Buscar hacia adelante (mismo vehículo, mismo día):
      Si tipo == "IDE Baja" → fin del viaje ✓
      Si tipo == "IDE Alta" → viaje sin cierre, romper
      Si fecha cambia → romper (nunca cruza días)
      Si otro tipo (ACTIVIDAD, PARADA, etc.) → agregar como evento intermedio
    Si no se encontró IDE Baja → descartar este IDE Alta
```

## Cómo calcular métricas del viaje
| Métrica | Cómo calcularla |
|---|---|
| **Duración** | `IDE Baja.fecha+hora − IDE Alta.fecha+hora` en minutos |
| **Distancia (km)** | Suma de `km` de todos los eventos `ACTIVIDAD` del viaje |
| **Velocidad máxima** | `MAX(velocidad_maxima)` de todos los eventos `ACTIVIDAD` |
| **Velocidad promedio** | `distancia / (duracion_hs)` |
| **Paradas** | Cantidad de eventos `PARADA` entre IDE Alta e IDE Baja |
| **Origen** | Coordenadas del evento `IDE Alta` |
| **Destino** | Coordenadas del evento `IDE Baja` |

## Cómo calcular horas de manejo de una persona (período)
1. Filtrar todos los registros del conductor (por nombre) en el rango de fechas
2. También traer los `IDE Alta` / `IDE Baja` del mismo vehículo en esas fechas (pueden tener `NID-*`)
3. Agrupar en viajes con el algoritmo anterior
4. Sumar `duracionMin` de todos los viajes → convertir a horas

## Alertas automáticas
| Condición | Alerta |
|---|---|
| `velocidad_maxima > 110 km/h` en algún ACTIVIDAD | Exceso de velocidad |
| 2 o más eventos PARADA en un viaje | Paradas no programadas |

## Notas importantes
- El límite de Supabase con `anon key` es **1000 filas por query** → usar `.range()` para paginar
- RLS está **deshabilitado** intencionalmente (app interna, solo lectura)
- Los datos son de Neuquén/Patagonia (zona horaria Argentina, UTC-3)
- `fecha` viene como string `"YYYY-MM-DD"`, `hora` como `"HH:MM:SS"` → construir Date con `new Date(\`${fecha}T${hora}\`)`
