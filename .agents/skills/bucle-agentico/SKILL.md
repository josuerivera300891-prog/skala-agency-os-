---
name: bucle-agentico
description: |
  Ejecutar features complejas por fases con mapeo de contexto real antes de cada fase.
  Activar cuando la tarea toca multiples archivos, requiere cambios en BD + codigo + UI
  coordinados, tiene fases que dependen una de otra, o cuando un PRP fue aprobado y hay
  que implementarlo.

  Usar cuando: "implementa feature compleja", "sistema nuevo", "PRP aprobado",
  "cambios multi-archivo", "BD + codigo + UI", "migracion compleja", "refactor grande".

  NO USAR para: fixes rapidos, auditorias, cambios en un solo archivo, preguntas.
---

# Modo BLUEPRINT del Bucle Agentico

> "No planifiques lo que no entiendes. Mapea contexto, luego planifica."

El modo BLUEPRINT es para sistemas complejos que requieren construccion por fases con
mapeo de contexto just-in-time.

---

## Cuando Usar BLUEPRINT

- La tarea requiere multiples componentes coordinados
- Involucra cambios en DB + codigo + UI
- Tiene fases que dependen una de otra
- Requiere entender contexto antes de implementar
- El sistema final tiene multiples partes integradas

### Ejemplos

```
"Sistema de campanas con templates + scheduling + analytics"
"Feature de leads con scoring + nurturing + automacion"
"Dashboard con metricas avanzadas + graficos + exportacion"
"Integracion API externa con auth + sync + webhooks"
"CRUD completo con validacion + permisos + audit trail"
"Pipeline nuevo con stages + triggers + notifications"
```

---

## Innovacion Clave: Mapeo de Contexto Just-In-Time

### Enfoque Tradicional (MAL)

```
Recibir problema -> Generar TODAS las tareas -> Ejecutar linealmente
```

Problema: Subtareas basadas en SUPOSICIONES, no en contexto real.

### Enfoque BLUEPRINT (BIEN)

```
Recibir problema
  -> Generar solo FASES (sin subtareas)
  -> ENTRAR en Fase 1
  -> MAPEAR contexto real de Fase 1
  -> GENERAR subtareas basadas en contexto REAL
  -> Ejecutar Fase 1
  -> ENTRAR en Fase 2
  -> MAPEAR contexto (incluyendo lo construido en Fase 1)
  -> GENERAR subtareas de Fase 2
  -> ... repetir ...
```

---

## El Flujo BLUEPRINT: 5 Pasos

### PASO 1: DELIMITAR Y DESCOMPONER EN FASES

- Entender el problema FINAL completo
- Romper en FASES ordenadas cronologicamente
- Identificar dependencias entre fases
- **NO generar subtareas todavia**
- Registrar en `task.md`

### PASO 2: ENTRAR EN FASE N — MAPEAR CONTEXTO

**Antes de generar subtareas, explorar:**

| Area | Que Verificar | Herramientas |
|------|---------------|-------------|
| Codebase | Archivos existentes, patrones, codigo reutilizable | `Grep`, `Glob`, `Read` |
| Base de Datos | Tablas, estructura, migraciones | SQL client, schema files |
| Dependencias | Lo construido en fases anteriores, restricciones | `Read` de archivos creados |
| Permisos | Auth, roles, RLS policies | Auth files, middleware |

**DESPUES de mapear**, generar subtareas especificas.

### PASO 3: EJECUTAR SUBTAREAS DE LA FASE

```
WHILE subtareas pendientes:
  1. Marcar subtarea in_progress en task.md
  2. Ejecutar la subtarea
  3. Usar herramientas segun juicio:
     - Build -> Verificar errores
     - DB client -> Consultar/modificar DB
     - Browser -> Validar UI
  4. Validar resultado
     - Error -> AUTO-BLINDAJE (paso 3.5)
     - OK -> Marcar completed
  5. Siguiente subtarea
```

### PASO 3.5: AUTO-BLINDAJE (cuando hay errores)

1. **ARREGLA** el codigo
2. **TESTEA** que funcione
3. **DOCUMENTA** el aprendizaje

**Formato:**
```markdown
### [YYYY-MM-DD]: [Titulo corto]
- **Error**: [Que fallo]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas aplica]
```

| Tipo de Error | Donde Documentar |
|---------------|------------------|
| Especifico de esta feature | PRP actual (seccion Aprendizajes) |
| Aplica a multiples features | Skill relevante |
| Aplica a TODO el proyecto | CLAUDE.md (seccion Aprendizajes) |

### PASO 4: TRANSICIONAR A SIGUIENTE FASE

- Confirmar fase actual REALMENTE completa
- Volver a PASO 2 con siguiente fase
- El contexto ahora INCLUYE lo construido

### PASO 5: VALIDACION FINAL

- Build completo sin errores
- Validacion visual si aplica
- Confirmar que el problema ORIGINAL esta resuelto
- Commit + deploy
- Reportar al usuario

---

## Checklist General en Cada Fase

- [ ] Codigo existente leido y entendido antes de modificar?
- [ ] Permisos y auth verificados?
- [ ] Validacion de entrada implementada?
- [ ] Tests relevantes ejecutados?
- [ ] Build pasa sin errores?

---

## Errores Comunes a Evitar

1. **Generar todas las subtareas al inicio** — Solo fases, subtareas se generan al entrar
2. **No re-mapear contexto entre fases** — Siempre mapear antes de cada fase
3. **Saltar validacion** — Build + verificacion despues de cada fase
4. **Asumir en vez de leer** — Siempre leer el codigo real antes de modificar

---

*"La precision viene de mapear la realidad, no de imaginar el futuro."*
*"El sistema que se blinda solo es invencible."*
