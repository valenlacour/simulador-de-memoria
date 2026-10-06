# Simulador de procesos y memoria

![CI](https://github.com/valenlacour/simulador-de-memoria/actions/workflows/ci.yml/badge.svg)

Biblioteca de clases en TypeScript que simula procesos, memoria contigua con particiones variables (First-Fit, Best-Fit y Worst-Fit) y planificación de CPU con Round-Robin y E/S determinista. AE2 intercátedra de Paradigmas y Lenguajes de Programación II y Sistemas Operativos, UCP 2026.

Es una biblioteca: no tiene consola ni `main`. Su funcionamiento se demuestra únicamente con pruebas automatizadas.

## Requisitos

- Node.js 22.12 o superior (la integración continua usa Node.js 24)
- npm (viene con Node.js)
- Git

## Instalación

```bash
git clone https://github.com/valenlacour/simulador-de-memoria.git
cd simulador-de-memoria
npm ci
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta todas las pruebas con Vitest |
| `npm run typecheck` | Verifica los tipos con el compilador de TypeScript |
| `npm run test:coverage` | Ejecuta las pruebas y mide la cobertura |

## Cobertura

- Herramienta: Vitest con el proveedor v8 (`@vitest/coverage-v8`).
- Comando reproducible: `npm run test:coverage`.
- Alcance: todos los archivos de `src/`, configurado con `include: ["src/**/*.ts"]` para que se midan aunque ningún test los importe. Se excluye `src/interfaces/`, que solo declara tipos y no genera código ejecutable.
- Umbral: la ejecución falla si la cobertura de líneas no supera el 90%.
- Reporte: se muestra en consola y en HTML en `coverage/index.html`. Se genera en cada ejecución y no se versiona.

## Integración continua

Cada push y cada pull request a `main` ejecuta en GitHub Actions la instalación, el chequeo de tipos y las pruebas con cobertura (`.github/workflows/ci.yml`). Si una prueba falla o la cobertura baja del umbral, el build queda en rojo.

## Estructura

```text
src/
  interfaces/   contratos: GestorMemoria, Planificador, PoliticaAsignacion, GestorBloqueados, ...
  modelos/      Proceso, BloqueMemoria, Memoria, PlanificadorRoundRobin, AgendaES, Simulador, ...
  politicas/    PrimerAjuste, MejorAjuste, PeorAjuste, su base abstracta y la fábrica
tests/          misma estructura que src/
docs/           bitácora
```

## Casos mínimos del Anexo I

`tests/modelos/Simulador.anexoI.test.ts` tiene un `describe` por cada caso de la tabla del enunciado: configuración y registro, asignación y espera, coalescencia, Round Robin, quantum y finalización, bloqueo por E/S, métricas y límites, y orden e invariantes.

## Ejemplo de uso (desde un test)

```ts
const simulador = new Simulador(ConfiguracionSimulador.deReferencia());
simulador.registrarProceso(1, 100, 3);
simulador.definirEventoES(1, 1, 2);
simulador.avanzarTick();
simulador.obtenerMetricas().obtenerOcupacionMemoria(); // 9.765625
```

## Diagramas UML

Archivos editables (draw.io) y su versión legible (PNG) en `docs/uml/`:

| Diagrama | Editable | Imagen |
|---|---|---|
| Clases | [Diagrama de Clases.drawio](docs/uml/Diagrama%20de%20Clases.drawio) | [PNG](docs/uml/Diagrama%20de%20clases.drawio.png) |
| Secuencia 1 - avanzarTick (RF06) | [.drawio](docs/uml/Diagrama%20de%20Secuencia-1-avanzarTick.drawio) | [PNG](docs/uml/Diagrama%20de%20Secuencia-1-avanzarTick.drawio.png) |
| Secuencia 2 - registro y admisión (RF02-RF04) | [.drawio](docs/uml/Diagrama%20de%20Secuencia-2-registro-y-admision.drawio) | [PNG](docs/uml/Diagrama%20de%20Secuencia-2-registro-y-admision.drawio.png) |
| Secuencia 3 - ejecución y coalescencia (RF05, RF07, RF08) | [.drawio](docs/uml/Diagrama%20de%20Secuencia-3-ejecucion-y-coalescencia.drawio) | [PNG](docs/uml/Diagrama%20de%20Secuencia-3-ejecucion-y-coalescencia.drawio.png) |
| Estados del proceso | [.drawio](docs/uml/Diagrama%20de%20estado.drawio) | [PNG](docs/uml/Diagrama%20de%20estado.drawio.png) |

Los `.drawio` se abren y se editan en https://app.diagrams.net.

![Diagrama de clases](docs/uml/Diagrama%20de%20clases.drawio.png)

## Informe técnico

[docs/Informe-AE2-CarruegaLacour.pdf](docs/Informe-AE2-CarruegaLacour.pdf)