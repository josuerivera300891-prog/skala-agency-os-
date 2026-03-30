---
name: memory-manager
description: |
  Sistema de memoria persistente POR PROYECTO. Guarda conocimiento en .agents/memory/
  dentro del repo, versionado con git. Leer MEMORY.md al inicio de cada sesion.
  Guardar proactivamente cuando el usuario corrige algo, cuando se descubre un patron,
  cuando se resuelve un bug, o cuando el usuario dice recordar/recuerda/guarda esto.

  Usar cuando: "recuerda", "remember", "guarda esto", "no olvides", "te acuerdas",
  "en que quedamos", "contexto anterior", "sesion anterior".

  NO USAR para: cosas derivables del codigo, git history, debugging trivial.
---

# Memory Manager — Memoria Persistente por Proyecto

## Estructura

```
.agents/memory/
├── MEMORY.md              <- Indice (leer al inicio de sesion)
├── user/                  <- Preferencias y estilo del usuario
├── feedback/              <- Correcciones directas (que hacer/no hacer)
├── project/               <- Estado de iniciativas en curso
└── reference/             <- Patrones, soluciones, configuraciones
```

## Cuando LEER

- **Inicio de sesion**: Leer MEMORY.md
- **Antes de proponer algo**: Verificar que no contradiga decisiones guardadas
- **Cuando el usuario pregunta**: "Te acuerdas de...?" -> buscar en memoria

## Cuando GUARDAR

| Trigger | Carpeta |
|---------|---------|
| Usuario te corrige | `feedback/` |
| Usuario dice "recuerda" | cualquiera |
| Bug no obvio resuelto | `reference/` |
| Decision de arquitectura | `project/` |
| Patron util descubierto | `reference/` |
| Preferencia del usuario | `user/` |

## Reglas

1. Consultar es gratis, guardar es caro — solo si sobrevive a la sesion
2. Fechas absolutas siempre (no "ayer" sino "2026-03-17")
3. Un archivo por tema, no mezclar
4. El usuario es dueno — puede borrar/revertir cualquier memoria
5. Sin duplicados con skills o global rules existentes
