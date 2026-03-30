# Security Checklist

## Antes de cada PR

### Autenticacion
- [ ] Se verifica auth en endpoints protegidos?
- [ ] Los CRON jobs usan auth segura?
- [ ] Las rutas admin estan protegidas por middleware?

### Validacion
- [ ] Todas las entradas tienen schema Zod?
- [ ] Se validan parametros de URL?
- [ ] Se sanitizan datos antes de mostrar?

### Base de Datos
- [ ] Las tablas nuevas tienen RLS habilitado?
- [ ] Los queries filtran por tenant/user scope?
- [ ] Se usan queries parametrizadas (no string concat)?

### Rate Limiting
- [ ] Endpoints publicos tienen rate limiting?
- [ ] Endpoints de auth tienen limites estrictos?

### Secrets
- [ ] No hay secrets hardcodeados?
- [ ] `.env.local` esta en `.gitignore`?
- [ ] Las keys de API estan en variables de entorno?

### Logging
- [ ] No se loggean datos sensibles (passwords, tokens)?
- [ ] Se usa logger estructurado en lugar de `console.log`?

---

## Patrones Seguros

### Rate Limiting
```typescript
import { rateLimiters, createRateLimitResponse } from '@/lib/rate-limit';

const result = await rateLimiters.api(identifier);
if (!result.success) {
    return createRateLimitResponse(result);
}
```

### Input Validation
```typescript
import { z } from 'zod';

const schema = z.object({
    email: z.string().email(),
    amount: z.number().positive(),
});

const validation = schema.safeParse(body);
if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### Secret Comparison
```typescript
import crypto from 'crypto';

const isValid = crypto.timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(expectedSecret)
);
```
