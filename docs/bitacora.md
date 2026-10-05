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

## 2026-10-04 (Políticas de asignación)
- Tareas: interfaz PoliticaAsignacion, clase abstracta PoliticaAsignacionBase y las tres políticas (First, Best y Worst-Fit), con tests por política y una prueba polimórfica.
- Decisiones: herencia justificada por la relación "es una" y sustitución: cualquier política sirve donde se espera un PoliticaAsignacion. La clase abstracta evita repetir el filtrado y el desempate por menor dirección (cada política solo define `comparar`). Memoria dependerá solo de la interfaz (inversión de dependencias).
- Obstáculos: noImplicitOverride obliga a escribir `override` también al implementar métodos abstractos.

## 2026-10-04 (Memoria)
- Tareas: clase Memoria con asignación contigua (partición y ajuste exacto), liberación, coalescencia a izquierda, derecha y ambos lados, métricas de memoria e interfaz GestorMemoria. Probada con las tres políticas.
- Decisiones: Memoria depende solo de la interfaz PoliticaAsignacion, que recibe por constructor. El mapa se expone como copia de solo lectura y los bloques son inmutables (doble encapsulamiento). Un helper de tests verifica las invariantes (continuidad, tamaño total, sin libres adyacentes) después de cada operación.
- Obstáculos: ninguno.

## 2026-10-04 (Planificador Round-Robin)
- Tareas: PlanificadorRoundRobin con cola FIFO, despacho, fin de quantum (expulsión o renovación), finalización y bloqueo por E/S. Interfaces Planificador y ProveedorEventosES, clase ResultadoEjecucion y VistaProceso (copia de solo lectura).
- Decisiones: el planificador administra la CPU y la cola, y resuelve cada tick con prioridad finalización > bloqueo > quantum. Pregunta por los eventos de E/S a través de una interfaz mínima (ProveedorEventosES), así se prueba con un doble. Hacia afuera solo entrega vistas inmutables, nunca el Proceso real. No cuenta cambios de contexto: informa qué pasó (ResultadoEjecucion) y eso lo cuenta quien coordina.
- Obstáculos: el reemplazo de texto multilínea falla por los saltos de línea de Windows; lo resolví buscando siempre una sola línea.

## 2026-10-04 (E/S y métricas)
- Tareas: EventoES, AgendaES, ColaBloqueados con su interfaz GestorBloqueados, MetricasSimulacion y RecolectorMetricas con su interfaz ColectorMetricas.
- Decisiones: AgendaES implementa ProveedorEventosES, el contrato que ya usa el planificador. Valida los eventos al registrarlos: datos enteros positivos (EventoES) y rechazo de los que nunca se dispararían (punto >= CPU total del proceso) o duplicados. ColaBloqueados devuelve solo pids, no objetos internos. Las métricas se recalculan al terminar cada tick y se entregan como objeto inmutable; los cambios de contexto cuentan solo expulsión por quantum con otros Listos y bloqueo por E/S (convención del RF09).
- Obstáculos: ninguno.

## 2026-10-04 (Simulador)
- Tareas: ConfiguracionSimulador, FabricaPoliticas y Simulador (registro de procesos, admisión, tick de cuatro fases, E/S y consultas de solo lectura), con pruebas de colaboración e invariantes del sistema.
- Decisiones: el Simulador solo coordina: la lógica vive en Memoria, el planificador, la cola de bloqueados y las métricas, que usa a través de interfaces. Una configuración inválida impide crear el simulador (RF01). Lo que ocurre en la CPU se traduce en acciones con una tabla Record<ResultadoCpu, ...> en lugar de condicionales. Hacia afuera solo salen vistas inmutables.
- Obstáculos: algunos tests míos tenían aserciones sin valor o casos mal planteados; los corregí antes de commitear.

## 2026-10-05 (Casos del Anexo I)
- Tareas: un archivo de pruebas con los 8 casos mínimos del Anexo I, probados de punta a punta a través del Simulador (26 tests). Quedan 302 tests en verde y cobertura del 100%.
- Decisiones: cada describe corresponde a una fila de la tabla del Anexo I, así la matriz RF > clase > test del informe los puede señalar directamente. Para saber qué proceso ejecutó en cada tick comparo la CPU restante antes y después, sin agregar métodos al Simulador solo para los tests.
- Obstáculos: armar mapas con huecos en posiciones exactas obliga a usar quantum 1 y CPU distintas para controlar en qué tick termina cada proceso.
