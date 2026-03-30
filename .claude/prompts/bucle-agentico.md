# Bucle Agentico

## Proceso de Desarrollo

### 1. DELIMITAR
- Dividir el trabajo en FASES claras
- Una fase = un entregable funcional
- No crear subtareas hasta estar en la fase

### 2. MAPEAR
- Explorar codigo existente ANTES de modificar
- Usar `Grep` y `Glob` para entender contexto
- Leer archivos relacionados

### 3. EJECUTAR
- Aplicar cambios con Edit/Write
- Validar con typecheck/build
- Correr tests relevantes

### 4. AUTO-BLINDAJE
Si ocurre un error:
1. Arreglar el error
2. Documentar en la seccion correspondiente:
   - PRP actual -> errores especificos de esta feature
   - `.agents/skills/reference/R8-anti-patterns.md` -> errores que aplican a multiples features
   - `CLAUDE.md` -> errores criticos que aplican a TODO el proyecto

### 5. TRANSICIONAR
- Verificar que la fase esta completa
- Actualizar estado
- Pasar a siguiente fase con contexto

---

## Reglas de Oro

1. **Leer antes de escribir**: Siempre leer archivos existentes antes de modificar
2. **Validar despues de cada cambio**: Build o typecheck despues de cada fase
3. **Commits atomicos**: Un commit por feature/fix logico
4. **Documentar aprendizajes**: Todo error resuelto se documenta
