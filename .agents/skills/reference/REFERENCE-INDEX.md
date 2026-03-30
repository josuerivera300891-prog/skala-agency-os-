# Skala Marketing OS — Developer Intelligence Reference Index

> Consulta la referencia correcta ANTES de hacer cambios. Este indice es tu router de decisiones.

## Cuando consultar que referencia

| Estoy por... | Consultar |
|--------------|-----------|
| **Empezar CUALQUIER tarea** (clasificar scope primero) | **R9-scope-classifier.md** |
| Quick check de errores comunes | **R8-anti-patterns.md** |
| Crear/modificar una migracion de DB | **R1-schema-atlas.md** |
| Crear/modificar un API endpoint o server action | **R2-api-playbook.md** |
| Construir un componente nuevo o modificar UI | **R4-component-atlas.md** |
| Crear un archivo nuevo o nombrar algo | **R6-file-conventions.md** |
| Escribir tests o manejar media/imagenes | **R7-testing-media-i18n.md** |

## Referencias disponibles

| ID | Nombre | Scope | Estado |
|----|--------|-------|--------|
| R1 | [schema-atlas](R1-schema-atlas.md) | Tablas, columnas, relaciones, RLS, naming DB | POR CREAR |
| R2 | [api-playbook](R2-api-playbook.md) | Endpoints, auth patterns, response formats | POR CREAR |
| R4 | [component-atlas](R4-component-atlas.md) | Componentes, patrones UI, lazy-loading | POR CREAR |
| R6 | [file-conventions](R6-file-conventions.md) | Naming, file placement, import aliases | POR CREAR |
| R7 | [testing-media-i18n](R7-testing-media-i18n.md) | Testing patterns, media handling | POR CREAR |
| R8 | [anti-patterns](R8-anti-patterns.md) | Anti-patrones documentados, errores reales | TEMPLATE |
| R9 | [scope-classifier](R9-scope-classifier.md) | Clasificar alcance de cada cambio | TEMPLATE |

## Reglas de uso

1. **Siempre consultar R8** antes de escribir codigo — previene errores repetidos
2. **Consultar R9** para clasificar el scope de tu cambio antes de implementar
3. **No duplicar** informacion que ya esta en estos documentos en `.agents/memory/`
4. **Actualizar** el documento relevante cuando se descubra un nuevo patron o error
