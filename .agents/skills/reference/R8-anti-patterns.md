---
id: R8
name: Anti-Patterns & Error Prevention
scope: Errores documentados, patrones prohibidos, lecciones aprendidas
consult-when: Antes de cualquier tarea (quick check), despues de un bug, al crear codigo nuevo
last-updated: 2026-03-30
---

# R8 — Anti-Patterns & Error Prevention

> Consultar este documento ANTES de escribir codigo. Cada entrada es un error real que ya ocurrio.
> Este documento CRECE con cada error encontrado y corregido.

---

## Categoria 1: Errores de Seguridad (CRITICOS)

### AP-01: SQL Injection en AI
- **Error**: LLM genera SQL arbitrario contra la base de datos
- **Regla**: NUNCA dejar que un LLM genere SQL. Solo usar funciones pre-definidas
- **Estado**: PREVENIDO

### AP-02: Secrets comparados con ===
- **Error**: Comparacion simple de strings (`===`) vulnerable a timing attacks
- **Fix**: `crypto.timingSafeEqual()` para comparar secrets
- **Regla**: NUNCA comparar secrets con `===`. Siempre usar `timingSafeEqual`

### AP-03: Endpoints sin validacion
- **Error**: Rutas aceptan `req.json()` sin `safeParse()`
- **Regla**: TODA ruta nueva DEBE usar Zod `safeParse()` antes de procesar datos

### AP-04: Endpoints sin rate limiting
- **Error**: Endpoints publicos sin proteccion contra abuse
- **Regla**: TODA ruta publica DEBE usar rate limiting

---

## Categoria 2: Errores de TypeScript

### AP-05: Uso de `any`
- **Regla**: NUNCA agregar `any` nuevo. Usar `unknown` + type narrowing
- **Si es inevitable**: agregar `// TODO: type properly` con contexto

### AP-06: ignoreBuildErrors en config
- **Error**: El build ignora errores de TypeScript
- **Regla**: No confiar en que el build detecta type errors. Verificar con typecheck

---

## Categoria 3: Errores de Framework

> Agregar aqui errores especificos del framework que uses (Next.js, Remix, etc.)

### AP-07: [Template]
- **Error**: [Que fallo]
- **Fix**: [Como se arreglo]
- **Regla**: [Que hacer siempre]

---

## Categoria 4: Errores de Logging

### AP-08: console.log en produccion
- **Regla**: SIEMPRE usar logger estructurado en vez de `console.log`
- **Formato**: `logger.info('[ComponentName] Action', { contextData })`

---

## Categoria 5: Errores de Workflow

### AP-09: Instalar paquetes sin plan aprobado
- **Regla**: SIEMPRE: plan -> aprobacion del usuario -> implementacion

### AP-10: Asumir en vez de leer
- **Regla**: SIEMPRE leer el codigo existente antes de modificar. Nunca asumir que sabes como esta

---

## Quick Checklist — Antes de escribir codigo

```
[ ] Valide input con Zod safeParse()?
[ ] Agregue rate limiting en endpoints publicos?
[ ] Use logger en vez de console.log?
[ ] Type guards en vez de `as any`?
[ ] timingSafeEqual para comparar secrets?
[ ] Lei el codigo existente antes de modificar?
[ ] Build/typecheck pasa sin errores?
```

---

## Historial de Errores

> Agregar aqui cada error encontrado con fecha, para que el sistema aprenda.

| Fecha | ID | Descripcion | Estado |
|-------|-----|-------------|--------|
| 2026-03-30 | AP-01 to AP-10 | Template inicial | Preventivo |
