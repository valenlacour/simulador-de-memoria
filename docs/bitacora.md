# Bitácora individual - AE2 Simulador de procesos y memoria

## 2026-10-04
- Tareas: configuré el repositorio con TypeScript + Vitest (el mismo stack del AE1).
- Decisiones: todo el código, los tests y los commits en español. Un commit por cada cambio chico, con su test.
- Estructura: `src/interfaces`, `src/modelos`, `src/politicas` y `tests` espejo de `src`.
- Obstáculos: los comandos iniciales eran de bash y la terminal es PowerShell; los adapté.
## 2026-10-04 (Proceso)
- Tareas: clase Proceso con estados, ejecución, bloqueo por E/S y finalización, cada una con sus tests. Borré la prueba de humo.
- Decisiones: un único método privado `transicionar` concentra qué cambios de estado son válidos. Sin setters públicos: el estado solo cambia con métodos del dominio (doble encapsulamiento).
- Obstáculos: Vitest avisaba por el tipo de módulo; lo resolví con `"type": "module"`.

## 2026-10-04 (BloqueMemoria)
- Tareas: clase BloqueMemoria con creación, ocupar/liberar, separar y fusionarCon, cada una con sus tests.
- Decisiones: el bloque es inmutable (cada operación devuelve un bloque nuevo), así Memoria puede exponer sus bloques sin riesgo. Un método privado `exigir` concentra las validaciones para no encadenar ifs. Un bloque nunca tiene tamaño cero: separar rechaza el tamaño exacto.
- Obstáculos: ninguno.
