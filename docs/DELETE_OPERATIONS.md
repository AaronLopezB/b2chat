# 🗑️ OPERACIONES DE ELIMINACIÓN - Sistema de Llamadas Programadas

Esta documentación describe todas las operaciones de eliminación disponibles en el sistema de llamadas programadas.

## 📋 Índice de Operaciones

1. [Eliminar Llamada Individual](#1-eliminar-llamada-individual)
2. [Eliminación en Lote (Bulk Delete)](#2-eliminación-en-lote-bulk-delete)
3. [Limpieza Automática (Cleanup)](#3-limpieza-automática-cleanup)
4. [Cancelar vs Eliminar](#4-cancelar-vs-eliminar)
5. [Ejemplos Prácticos](#5-ejemplos-prácticos)

---

## 1. Eliminar Llamada Individual

### Endpoint
```
DELETE /api/scheduled-calls/:callId?force=true|false
```

### Descripción
Elimina una llamada específica por su ID. Por defecto, solo permite eliminar llamadas completadas, fallidas o canceladas.

### Parámetros
- **callId** (path): ID de la llamada a eliminar
- **force** (query, opcional): `true` para forzar eliminación de llamadas pendientes

### Ejemplos

**Eliminar llamada completada:**
```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/123" \
  -H "x-api-key: tu_api_key"
```

**Forzar eliminación de llamada pendiente:**
```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/123?force=true" \
  -H "x-api-key: tu_api_key"
```

### Respuestas

**✅ Éxito:**
```json
{
  "ok": true,
  "msg": "Call deleted successfully",
  "deleted_call_id": 123
}
```

**❌ Error - No se puede eliminar:**
```json
{
  "ok": false,
  "msg": "Cannot delete pending or processing calls. Use force=true to override or cancel first.",
  "current_status": "pending"
}
```

---

## 2. Eliminación en Lote (Bulk Delete)

### Endpoint
```
DELETE /api/scheduled-calls/bulk/delete
```

### Descripción
Elimina múltiples llamadas que cumplan criterios específicos. Requiere confirmación explícita.

### Body Parameters
```json
{
  "confirm_delete": "true",           // REQUERIDO: Confirmación explícita
  "status": ["completed", "failed"],  // Opcional: Estados a eliminar
  "older_than_days": 30,             // Opcional: Eliminar más antiguas que X días
  "priority": 1,                     // Opcional: Solo llamadas de prioridad específica
  "call_ids": [123, 456, 789]        // Opcional: IDs específicos
}
```

### Ejemplos

**Eliminar todas las llamadas completadas de más de 30 días:**
```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/bulk/delete" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "confirm_delete": "true",
    "status": ["completed"],
    "older_than_days": 30
  }'
```

**Eliminar llamadas específicas por ID:**
```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/bulk/delete" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "confirm_delete": "true",
    "call_ids": [123, 456, 789]
  }'
```

**Eliminar todas las llamadas fallidas de baja prioridad:**
```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/bulk/delete" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "confirm_delete": "true",
    "status": ["failed"],
    "priority": 1
  }'
```

### Respuesta
```json
{
  "ok": true,
  "msg": "Bulk deletion completed successfully",
  "deleted_count": 47,
  "criteria": {
    "status": ["completed"],
    "older_than_days": 30
  }
}
```

---

## 3. Limpieza Automática (Cleanup)

### Endpoint
```
POST /api/scheduled-calls/cleanup
```

### Descripción
Operación de mantenimiento para limpiar llamadas antiguas. Incluye modo "dry run" para preview.

### Body Parameters
```json
{
  "retention_days": 30,                           // Días de retención (default: 30)
  "status_filter": ["completed", "failed"],      // Estados a limpiar
  "dry_run": true                                 // Solo mostrar qué se eliminaría
}
```

### Ejemplos

**Dry Run - Ver qué se eliminaría:**
```bash
curl -X POST "http://localhost:4000/api/scheduled-calls/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "retention_days": 30,
    "status_filter": ["completed", "failed", "cancelled"],
    "dry_run": true
  }'
```

**Ejecutar limpieza real:**
```bash
curl -X POST "http://localhost:4000/api/scheduled-calls/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "retention_days": 30,
    "status_filter": ["completed", "failed"],
    "dry_run": false
  }'
```

### Respuestas

**Dry Run:**
```json
{
  "ok": true,
  "msg": "Dry run completed - no data was deleted",
  "would_delete": 156,
  "breakdown": [
    { "status": "completed", "count": 134, "oldest": "2025-09-15T10:30:00Z" },
    { "status": "failed", "count": 22, "oldest": "2025-09-20T08:15:00Z" }
  ],
  "criteria": {
    "retention_days": 30,
    "status_filter": ["completed", "failed"]
  }
}
```

**Limpieza Real:**
```json
{
  "ok": true,
  "msg": "Cleanup completed successfully", 
  "deleted_count": 156,
  "retention_days": 30,
  "status_filter": ["completed", "failed"]
}
```

---

## 4. Cancelar vs Eliminar

### 🔄 Cancelar (Recomendado)
- **Uso**: Para llamadas que aún no se han ejecutado
- **Efecto**: Cambia estado a "cancelled", mantiene histórico
- **Endpoint**: `PATCH /api/scheduled-calls/:id/cancel`

```bash
curl -X PATCH "http://localhost:4000/api/scheduled-calls/123/cancel" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{"reason": "Ya no es necesaria"}'
```

### 🗑️ Eliminar (Permanente)
- **Uso**: Para remover completamente registros
- **Efecto**: Elimina el registro y todos sus logs
- **Endpoint**: `DELETE /api/scheduled-calls/:id`

```bash
curl -X DELETE "http://localhost:4000/api/scheduled-calls/123" \
  -H "x-api-key: tu_api_key"
```

---

## 5. Ejemplos Prácticos

### Caso 1: Mantenimiento Semanal
```bash
# 1. Ver qué se eliminaría
curl -X POST "http://localhost:4000/api/scheduled-calls/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{"retention_days": 7, "dry_run": true}'

# 2. Si está bien, ejecutar limpieza
curl -X POST "http://localhost:4000/api/scheduled-calls/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{"retention_days": 7, "dry_run": false}'
```

### Caso 2: Eliminar Llamadas Fallidas Específicas
```bash
# Primero buscar llamadas fallidas
curl "http://localhost:4000/api/scheduled-calls?status=failed&limit=50" \
  -H "x-api-key: tu_api_key"

# Eliminar las que tengan más de 3 reintentos
curl -X DELETE "http://localhost:4000/api/scheduled-calls/bulk/delete" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "confirm_delete": "true",
    "status": ["failed"]
  }'
```

### Caso 3: Limpiar por Proyecto/Usuario
```bash
# Si necesitas eliminar llamadas de un proyecto específico,
# primero obtén los IDs con filtros
curl "http://localhost:4000/api/scheduled-calls?limit=1000" \
  -H "x-api-key: tu_api_key" | jq '.calls[] | select(.label | contains("PROYECTO_X")) | .id'

# Luego elimina usando los IDs
curl -X DELETE "http://localhost:4000/api/scheduled-calls/bulk/delete" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "confirm_delete": "true",
    "call_ids": [101, 102, 103, 104]
  }'
```

---

## ⚠️ Precauciones de Seguridad

1. **Confirmación Obligatoria**: Todas las operaciones en lote requieren `confirm_delete: "true"`
2. **Sin Reversión**: Las eliminaciones no se pueden deshacer
3. **Logs Incluidos**: Al eliminar una llamada se eliminan también todos sus logs
4. **Permisos**: Todas las rutas requieren autenticación válida
5. **Validación**: Los parámetros se validan estrictamente

---

## 📊 Monitoreo de Eliminaciones

Las operaciones de limpieza se registran automáticamente en la tabla `cron_job_logs`:

```sql
SELECT * FROM cron_job_logs 
WHERE job_type = 'cleanup' 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🔧 Configuración Avanzada

Para automatizar las operaciones de limpieza, puedes:

1. **Configurar en Cron Jobs**: Editar `cron_job_config` para cambiar frecuencia
2. **Variables de Entorno**: Definir `CLEANUP_RETENTION_DAYS=30`
3. **Webhooks**: Recibir notificaciones después de limpiezas masivas

---

**💡 Consejo**: Siempre usa `dry_run: true` primero para ver qué se eliminaría antes de ejecutar operaciones destructivas.