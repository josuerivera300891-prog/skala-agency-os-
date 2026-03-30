---
name: image-generation
description: |
  Generar y editar imagenes usando OpenRouter + Gemini.
  Incluye script CLI y modulo server-side reutilizable desde cron jobs y API routes.

  Usar cuando: "genera imagen", "create image", "thumbnail", "banner", "blog image",
  "genera visual", "foto para", "ilustracion", "asset visual".

  Pre-requisito: OPENROUTER_API_KEY en .env.local
  NO USAR para: subir imagenes del usuario (usar storage), iconos (usar lucide-react).
---

# Image Generation — OpenRouter + Gemini

## Modulo Server-Side

```typescript
import { generateImage } from '@/lib/image-generator';

const imageUrl = await generateImage({
  prompt: 'Professional marketing dashboard with analytics charts, clean design',
  aspect: '16:9',
  outputPath: 'public/blog/mi-imagen.png', // opcional
});
```

## Desde CLI

```bash
node .agents/skills/image-generation/scripts/generate-image.js \
  --prompt "Logo minimalista en cyan sobre fondo oscuro" \
  --output public/images/logo.png \
  --aspect 1:1
```

## Argumentos CLI

| Arg | Requerido | Default |
|-----|-----------|---------|
| `--prompt` | SI | — |
| `--image` | NO | — (para editar imagen existente) |
| `--output` | NO | `public/generated/img-{timestamp}.png` |
| `--aspect` | NO | `1:1` |
| `--model` | NO | `google/gemini-2.0-flash-exp` |

## Casos de Uso

| Caso | Como |
|------|------|
| Blog thumbnails | Cron job llama `generateImage()` con el titulo del post |
| Banners de campana | Al crear campana, generar banner automatico |
| Social media assets | Generar imagenes para posts automatizados |
| Placeholder de producto | Si producto sin foto, generar visual |

## Modelos Disponibles

| Modelo | Mejor para |
|--------|-----------|
| `google/gemini-2.0-flash-exp` | Default, rapido, buena calidad |
| `google/gemini-2.5-flash-preview-image-generation` | Mejor calidad |
| `google/gemini-2.5-pro-preview-image-generation` | Pro quality, mas detalle |
