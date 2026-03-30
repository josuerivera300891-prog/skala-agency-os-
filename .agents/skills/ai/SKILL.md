---
name: ai
description: |
  Referencia de templates de IA con Vercel AI SDK + OpenRouter.
  Templates para: generative-ui, RAG, structured-outputs, web-search, function-calling.

  Guardar como referencia para implementar features de IA.
  Consultar antes de crear cualquier endpoint o componente de IA.
---

# AI Templates — Referencia

> Templates y patrones para implementar features de IA en el proyecto.

## Templates Disponibles

| Template | Descripcion | Cuando usar |
|----------|-------------|-------------|
| **generative-ui** | LLM renderiza componentes React en tiempo real | Chat que muestra widgets dinamicos (graficos, tablas, cards) |
| **rag** | Busqueda semantica en documentos/datos del negocio | Cuando el LLM necesita buscar en conocimiento interno |
| **structured-outputs** | Respuestas JSON tipadas con Zod | Clasificacion, extraccion de datos, formularios inteligentes |
| **web-search** | Grounding con internet | Cuando el LLM necesita datos actualizados de la web |
| **tools/function-calling** | LLM ejecuta acciones via funciones | Cuando el chat necesita crear/modificar/consultar datos |

## Patron Seguro para AI + Database

```typescript
// NUNCA dejar que el LLM genere SQL directo
// SIEMPRE usar funciones pre-definidas

const aiQueryFunctions = {
  getStats: (tenantId: string) => { /* query segura */ },
  getRecords: (tenantId: string, filters: Filters) => { /* query segura */ },
  getSummary: (tenantId: string, period: string) => { /* query segura */ },
};

// El LLM solo puede llamar funciones del map, nunca SQL raw
```

## Generative UI — Patron

```typescript
// El LLM decide que componente renderizar
const tools = {
  showChart: { description: 'Mostrar grafico', parameters: z.object({ data: z.array(...) }) },
  showTable: { description: 'Mostrar tabla', parameters: z.object({ rows: z.array(...) }) },
  showCard:  { description: 'Mostrar card', parameters: z.object({ title: z.string(), value: z.string() }) },
};
// Frontend renderiza el componente que el LLM elige
```

## Structured Outputs — Patron

```typescript
import { generateObject } from 'ai';

const result = await generateObject({
  model: openrouter('google/gemini-2.0-flash'),
  schema: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    topics: z.array(z.string()),
    summary: z.string(),
  }),
  prompt: `Analiza este texto: ${text}`,
});
```

## Checklist antes de implementar IA

- [ ] Input sanitizado (no inyectar prompts del usuario sin filtrar)
- [ ] Queries pre-definidas (no SQL generado por LLM)
- [ ] Rate limiting en endpoints de IA
- [ ] Respuestas validadas con Zod (structured outputs)
- [ ] Costos estimados por request
- [ ] Fallback si el modelo falla
