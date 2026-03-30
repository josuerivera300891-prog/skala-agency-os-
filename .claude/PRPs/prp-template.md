# PRP-XXX: [Nombre de la Feature]

## Metadata
- **Autor**: [Nombre]
- **Fecha**: YYYY-MM-DD
- **Estado**: Draft | En Revision | Aprobado | Implementado
- **Prioridad**: Alta | Media | Baja

---

## 1. Problema

Que problema estamos resolviendo?

---

## 2. Solucion Propuesta

Descripcion de alto nivel de la solucion.

---

## 3. Diseno Tecnico

### 3.1 Componentes Afectados
- [ ] Base de datos (nuevas tablas/columnas)
- [ ] API routes
- [ ] Componentes UI
- [ ] CRON jobs
- [ ] Integraciones externas

### 3.2 Schema de Base de Datos
```sql
-- Si aplica
CREATE TABLE xxx (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    -- ...
);
```

### 3.3 API Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/xxx | ... |
| POST | /api/xxx | ... |

### 3.4 Componentes UI
- `ComponenteA`: Descripcion
- `ComponenteB`: Descripcion

---

## 4. Plan de Implementacion

### Fase 1: [Nombre]
- [ ] Tarea 1
- [ ] Tarea 2

### Fase 2: [Nombre]
- [ ] Tarea 3
- [ ] Tarea 4

---

## 5. Testing

- [ ] Unit tests para logica de negocio
- [ ] Tests de API endpoints
- [ ] Tests de componentes

---

## 6. Consideraciones de Seguridad

- [ ] RLS habilitado
- [ ] Validacion de entrada
- [ ] Rate limiting (si aplica)

---

## 7. Errores y Aprendizajes

> Documentar aqui errores encontrados durante la implementacion

### [Fecha]: [Titulo]
- **Error**: Que fallo
- **Fix**: Como se arreglo
- **Aplicar en**: Donde mas aplica
