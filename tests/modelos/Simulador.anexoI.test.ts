import { Simulador } from "../../src/modelos/Simulador";
import { ConfiguracionSimulador } from "../../src/modelos/ConfiguracionSimulador";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";
import { verificarInvariantes } from "./invariantesMemoria";
import { verificarInvariantesSistema } from "./invariantesSistema";

/**
 * Casos mínimos de verificación del Anexo I del enunciado, probados de punta a punta
 * a través del Simulador. Cada describe corresponde a una fila de la tabla.
 */

const crearSimulador = (
  memoria: number,
  quantum: number,
  politica: NombrePolitica = NombrePolitica.FIRST_FIT,
): Simulador => new Simulador(new ConfiguracionSimulador(memoria, quantum, politica));

const avanzar = (simulador: Simulador, ticks: number): void => {
  Array.from({ length: ticks }).forEach(() => simulador.avanzarTick());
};

/** Avanza un tick y devuelve el PID que consumió CPU en él (null si la CPU quedó libre). */
const ejecutarYObservar = (simulador: Simulador): number | null => {
  const antes = new Map(simulador.obtenerProcesos().map((v) => [v.obtenerPid(), v.obtenerCpuRestante()]));
  simulador.avanzarTick();
  const ejecuto = simulador
    .obtenerProcesos()
    .find((v) => v.obtenerCpuRestante() < (antes.get(v.obtenerPid()) as number));
  return ejecuto === undefined ? null : ejecuto.obtenerPid();
};

/** Bloques del mapa como [inicio, tamaño, pid] para comparar de una sola vez. */
const describirMapa = (simulador: Simulador): [number, number, number | null][] =>
  simulador
    .obtenerMapaMemoria()
    .map((b) => [b.obtenerInicio(), b.obtenerTamano(), b.obtenerPidProceso()]);

describe("Anexo I - Caso 1: configuración y registro", () => {
  it("el estado inicial es correcto", () => {
    const simulador = new Simulador(ConfiguracionSimulador.deReferencia());
    expect(simulador.obtenerTickActual()).toBe(0);
    expect(describirMapa(simulador)).toEqual([[0, 1024, null]]);
    expect(simulador.obtenerProcesoEnCpu()).toBeNull();
    expect(simulador.obtenerColaListos()).toHaveLength(0);
    expect(simulador.obtenerBloqueados()).toHaveLength(0);
    expect(simulador.obtenerProcesosEsperandoMemoria()).toHaveLength(0);
    expect(simulador.obtenerTerminados()).toHaveLength(0);
  });

  it.each([
    [0, 2],
    [-10, 2],
    [100, 0],
    [100, 1.5],
  ])("rechaza parámetros inválidos (memoria %d, quantum %d)", (memoria, quantum) => {
    expect(() => crearSimulador(memoria, quantum)).toThrow();
  });

  it("rechaza un PID repetido", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 2);
    expect(() => simulador.registrarProceso(1, 10, 2)).toThrow();
    expect(simulador.obtenerProcesos()).toHaveLength(1);
  });

  it("rechaza un proceso mayor que la memoria", () => {
    const simulador = crearSimulador(100, 2);
    expect(() => simulador.registrarProceso(1, 101, 2)).toThrow();
    expect(simulador.obtenerProcesos()).toHaveLength(0);
  });
});

describe("Anexo I - Caso 2: asignación y espera", () => {
  it("partición parcial: el proceso ocupa el inicio y el resto queda libre", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 5);
    simulador.avanzarTick();
    expect(describirMapa(simulador)).toEqual([
      [0, 30, 1],
      [30, 70, null],
    ]);
  });

  it("ajuste exacto: el proceso ocupa todo el bloque", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 100, 5);
    simulador.avanzarTick();
    expect(describirMapa(simulador)).toEqual([[0, 100, 1]]);
  });

  // Huecos de 30 KB en 0, 20 KB en 40 y 40 KB en 70; un proceso de 15 KB cabe en los tres.
  it.each([
    [NombrePolitica.FIRST_FIT, 0],
    [NombrePolitica.BEST_FIT, 40],
    [NombrePolitica.WORST_FIT, 70],
  ])("selección según política: %s ubica el proceso en %d", (politica, inicioEsperado) => {
    const simulador = crearSimulador(110, 1, politica);
    simulador.registrarProceso(1, 30, 1);
    simulador.registrarProceso(2, 10, 9);
    simulador.registrarProceso(3, 20, 1);
    simulador.registrarProceso(4, 10, 9);
    simulador.registrarProceso(5, 40, 1);
    avanzar(simulador, 5);
    expect(describirMapa(simulador)).toEqual([
      [0, 30, null],
      [30, 10, 2],
      [40, 20, null],
      [60, 10, 4],
      [70, 40, null],
    ]);
    simulador.registrarProceso(6, 15, 9);
    simulador.avanzarTick();
    const bloque = simulador.obtenerMapaMemoria().find((b) => b.obtenerPidProceso() === 6);
    expect(bloque?.obtenerInicio()).toBe(inicioEsperado);
    verificarInvariantes(simulador.obtenerMapaMemoria(), 110);
  });

  it("si no hay bloque suficiente falla sin modificar el mapa y lo admite al liberarse memoria", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 60, 2);
    simulador.registrarProceso(2, 60, 1);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(describirMapa(simulador)).toEqual([
      [0, 60, 1],
      [60, 40, null],
    ]);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerTerminados().map((v) => v.obtenerPid())).toEqual([1, 2]);
  });
});

describe("Anexo I - Caso 3: coalescencia", () => {
  // Con quantum 1 los procesos se turnan: P1 ejecuta en el tick 1, P2 en el 2 y P3 en el 3.
  it("fusiona con el vecino izquierdo", () => {
    const simulador = crearSimulador(80, 1);
    simulador.registrarProceso(1, 20, 5);
    simulador.registrarProceso(2, 20, 1);
    simulador.registrarProceso(3, 20, 1);
    simulador.registrarProceso(4, 20, 5);
    avanzar(simulador, 3);
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 1],
      [20, 40, null],
      [60, 20, 4],
    ]);
  });

  it("fusiona con el vecino derecho", () => {
    const simulador = crearSimulador(80, 1);
    simulador.registrarProceso(1, 20, 5);
    simulador.registrarProceso(2, 20, 5);
    simulador.registrarProceso(3, 20, 1);
    avanzar(simulador, 3);
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 1],
      [20, 20, 2],
      [40, 40, null],
    ]);
  });

  it("fusiona con ambos vecinos", () => {
    const simulador = crearSimulador(80, 1);
    simulador.registrarProceso(1, 20, 5);
    simulador.registrarProceso(2, 20, 1);
    simulador.registrarProceso(3, 20, 1);
    avanzar(simulador, 2);
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 1],
      [20, 20, null],
      [40, 20, 3],
      [60, 20, null],
    ]);
    simulador.avanzarTick();
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 1],
      [20, 60, null],
    ]);
  });

  it("al liberar todos los procesos queda un único bloque libre del tamaño total", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 3);
    simulador.registrarProceso(2, 20, 2);
    simulador.registrarProceso(3, 40, 4);
    avanzar(simulador, 9);
    expect(simulador.obtenerTerminados()).toHaveLength(3);
    expect(describirMapa(simulador)).toEqual([[0, 100, null]]);
  });
});

describe("Anexo I - Caso 4: Round Robin", () => {
  it("Q = 2, P1 con CPU 3 y P2 con CPU 2: ejecutan P1, P1, P2, P2, P1 con un cambio de contexto", () => {
    const simulador = crearSimulador(1024, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.registrarProceso(2, 100, 2);
    const orden = [1, 2, 3, 4, 5].map(() => ejecutarYObservar(simulador));
    expect(orden).toEqual([1, 1, 2, 2, 1]);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(1);
    expect(simulador.obtenerTerminados().map((v) => v.obtenerPid())).toEqual([2, 1]);
  });
});

describe("Anexo I - Caso 5: quantum y finalización", () => {
  it("un único proceso renueva su quantum sin cambio de contexto", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 5);
    const orden = [1, 2, 3, 4, 5].map(() => ejecutarYObservar(simulador));
    expect(orden).toEqual([1, 1, 1, 1, 1]);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
  });

  it("finalizar en el límite del quantum no lo reencola", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 2);
    simulador.registrarProceso(2, 10, 3);
    avanzar(simulador, 2);
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
  });
});

describe("Anexo I - Caso 6: bloqueo por E/S", () => {
  it("bloquea, conserva la memoria, no consume CPU y retorna a Listos al vencer el temporizador", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 3);
    simulador.registrarProceso(2, 20, 4);
    simulador.definirEventoES(1, 1, 2);

    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.BLOQUEADO);
    expect(simulador.obtenerBloqueados().map((v) => v.obtenerPid())).toEqual([1]);
    expect(describirMapa(simulador)[0]).toEqual([0, 30, 1]);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(1);

    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.BLOQUEADO);
    expect(simulador.obtenerProceso(1).obtenerCpuRestante()).toBe(2);
    expect(simulador.obtenerProceso(1).obtenerBloqueoRestante()).toBe(1);

    simulador.avanzarTick();
    expect(simulador.obtenerBloqueados()).toHaveLength(0);
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.LISTO);
    expect(simulador.obtenerProceso(1).obtenerCpuRestante()).toBe(2);
    expect(simulador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([1, 2]);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(2);
  });
});

describe("Anexo I - Caso 7: métricas y límites", () => {
  it("huecos no contiguos de 100 y 300 KB: libre total 400, mayor hueco 300 y fragmentación 25%", () => {
    const simulador = crearSimulador(500, 1);
    simulador.registrarProceso(1, 100, 1);
    simulador.registrarProceso(2, 50, 9);
    simulador.registrarProceso(3, 300, 1);
    simulador.registrarProceso(4, 50, 9);
    avanzar(simulador, 3);
    expect(describirMapa(simulador)).toEqual([
      [0, 100, null],
      [100, 50, 2],
      [150, 300, null],
      [450, 50, 4],
    ]);
    const metricas = simulador.obtenerMetricas();
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(400);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(300);
    expect(metricas.obtenerFragmentacionExterna()).toBe(25);
    expect(metricas.obtenerOcupacionMemoria()).toBe(20);
  });

  it("con la memoria llena: ocupación 100%, sin memoria libre y fragmentación 0%", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.avanzarTick();
    const metricas = simulador.obtenerMetricas();
    expect(metricas.obtenerOcupacionMemoria()).toBe(100);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(0);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(0);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
    expect(metricas.obtenerUtilizacionCpu()).toBe(100);
  });

  it("en el tick 0 la utilización de CPU es 0% y toda la memoria está libre", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 3);
    const metricas = simulador.obtenerMetricas();
    expect(simulador.obtenerTickActual()).toBe(0);
    expect(metricas.obtenerUtilizacionCpu()).toBe(0);
    expect(metricas.obtenerOcupacionMemoria()).toBe(0);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(100);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
  });
});

describe("Anexo I - Caso 8: orden e invariantes", () => {
  it("una liberación al final del tick habilita la admisión recién en el siguiente", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 100, 1);
    simulador.registrarProceso(2, 50, 2);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(describirMapa(simulador)).toEqual([[0, 100, null]]);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(describirMapa(simulador)[0]).toEqual([0, 50, 2]);
  });

  it("en cada tick no hay duplicados, solapamientos ni dos procesos en CPU", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 40, 4);
    simulador.registrarProceso(2, 30, 3);
    simulador.registrarProceso(3, 50, 2);
    simulador.registrarProceso(4, 30, 5);
    simulador.definirEventoES(2, 1, 2);
    simulador.definirEventoES(4, 2, 1);
    Array.from({ length: 20 }).forEach(() => {
      simulador.avanzarTick();
      verificarInvariantesSistema(simulador, 100);
    });
    expect(simulador.obtenerTerminados()).toHaveLength(4);
    expect(describirMapa(simulador)).toEqual([[0, 100, null]]);
  });
});