---
id: R9
name: Scope Classifier
scope: Clasificar el alcance de cada cambio antes de implementar
consult-when: SIEMPRE antes de implementar cualquier cambio. Determina que modulos se afectan y que archivos tocar.
last-updated: 2026-03-30
---

# R9 — Scope Classifier

> "Antes de tocar una linea de codigo, clasifica el scope. Si no sabes el scope, no toques nada."

---

## 1. Los 4 Niveles de Scope

### GLOBAL — Afecta a TODO el sistema

**Que es**: Infraestructura compartida que no tiene logica de negocio especifica.

**Ejemplos**:
- Auth system
- Rate limiting
- Logger
- Database clients
- Env validation
- Error tracking (Sentry)
- Security headers
- Middleware

**Regla**: Cambios aqui NUNCA deben tener condicionales de modulo/feature. Si necesitas un condicional, no es GLOBAL.

**Checklist antes de cambiar**:
```
[ ] Esto funciona igual para todos los modulos del sistema?
[ ] No tiene ninguna referencia a un modulo especifico?
[ ] Si la respuesta a todo es SI -> es GLOBAL
```

---

### PLATFORM — Afecta a la plataforma SaaS, no al negocio del usuario

**Que es**: Logica del SaaS en si — como los usuarios se suscriben, pagan, y se administran.

**Ejemplos**:
- SaaS billing / subscriptions
- User onboarding
- Admin panel de la plataforma
- Registration flow
- Blog / contenido de marketing
- Platform settings

**Regla**: Estos cambios afectan a como los USUARIOS interactuan con la plataforma, no a la logica core del producto.

---

### MODULE — Un modulo o feature especifico del producto

**Que es**: Logica que solo aplica a un modulo del sistema.

**Ejemplos**: Campanas, Leads, Analytics, Templates, Automaciones, etc.

**Regla**: Guard explicito para el modulo. No contaminar otros modulos.

**Checklist antes de cambiar**:
```
[ ] Este feature SOLO aplica a un modulo?
[ ] Tengo guard explicito?
[ ] No estoy contaminando logica de otros modulos?
```

---

### TENANT-SPECIFIC — Configuracion de una cuenta individual

**Que es**: Settings que cada tenant/cuenta configura para su uso.

**Ejemplos**:
- Branding (colors, logo, name)
- Timezone
- Integraciones conectadas
- Preferencias de notificacion
- API keys propias

**Regla**: Estos settings se leen de la DB y se pasan como props. NUNCA hardcodear valores que deberian ser configurables por tenant.

---

## 2. Arbol de Decision

```
Mi cambio tiene logica de negocio?
  |
  +- NO -> Es infraestructura? -> GLOBAL
  |        Es admin de la plataforma? -> PLATFORM
  |
  +- SI -> Aplica a TODOS los modulos?
           |
           +- SI -> GLOBAL (raro para logica de negocio)
           |
           +- NO -> Es config de UN tenant?
                    +- SI -> TENANT-SPECIFIC
                    +- NO -> MODULE (especificar cual)
```

---

## 3. Regla de Oro

**Antes de escribir UNA linea de codigo:**

```
1. Que scope tiene mi cambio? (clasificar con el arbol)
2. Que modulos afecto? (listar explicitamente)
3. Que tablas toco? (verificar en R1)
4. Que componentes modifico? (verificar en R4)
5. Esto repite algun anti-patron de R8?
```

Si no puedo responder TODAS estas preguntas, no estoy listo para implementar.
