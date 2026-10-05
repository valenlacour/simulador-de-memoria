import { Simulador } from "../../src/modelos/Simulador";
import { ConfiguracionSimulador } from "../../src/modelos/ConfiguracionSimulador";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import type { VistaProceso } from "../../src/modelos/VistaProceso";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";
import { verificarInvariantes } from "./invariantesMemoria";

const crearSimulador = (
  memoria = 100,
  quantum = 2,
  politica: NombrePolitica = NombrePolitica.FIRST_FIT,
): Simulador => new Simulador(new ConfiguracionSimulador(memoria, quantum, politica));

describe("Simulador - configuración e inicio (RF01)", () => {
  it("con la configuración de referencia inicia en el tick 0 con una memoria vacía de 1024 KB", () => {
    const simulador = new Simulador(ConfiguracionSimulador.deReferencia());
    expect(simulador.obtenerTickActual()).toBe(0);
    expect(simulador.obtenerConfiguracion().obtenerMemoriaTotal()).toBe(1024);
    expect(simulador.obtenerConfiguracion().obtenerQuantum()).toBe(2);
    const mapa = simulador.obtenerMapaMemoria();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].obtenerInicio()).toBe(0);
    expect(mapa[0].obtenerTamano()).toBe(1024);
    expect(mapa[0].estaLibre()).toBe(true);
    verificarInvariantes(mapa, 1024);
  });

  it("inicia con la CPU libre, las colas vacías y los contadores en cero", () => {
    const simulador = crearSimulador(1024, 2);
    expect(simulador.obtenerProcesoEnCpu()).toBeNull();
    expect(simulador.obtenerColaListos()).toHaveLength(0);
    expect(simulador.obtenerBloqueados()).toHaveLength(0);
    const metricas = simulador.obtenerMetricas();
    expect(metricas.obtenerOcupacionMemoria()).toBe(0);
    expect(metricas.obtenerUtilizacionCpu()).toBe(0);
    expect(metricas.obtenerCambiosContexto()).toBe(0);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(1024);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(1024);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
  });

  const politicas: [NombrePolitica, string][] = [
    [NombrePolitica.FIRST_FIT, "First-Fit"],
    [NombrePolitica.BEST_FIT, "Best-Fit"],
    [NombrePolitica.WORST_FIT, "Worst-Fit"],
  ];

  it.each(politicas)("usa la política %s elegida al configurar", (politica, nombre) => {
    expect(crearSimulador(100, 2, politica).obtenerNombrePolitica()).toBe(nombre);
  });

  it("una configuración inválida impide crear el simulador", () => {
    expect(() => new Simulador(new ConfiguracionSimulador(0, 2))).toThrow();
    expect(() => new Simulador(new ConfiguracionSimulador(1024, -1))).toThrow();
  });
});
describe("Simulador - registro y consulta de procesos (RF02)", () => {
  it("registra procesos NUEVOS con CPU restante igual a la total, en orden de registro", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(2, 30, 4);
    simulador.registrarProceso(1, 20, 3);
    expect(simulador.obtenerProcesos().map((v) => v.obtenerPid())).toEqual([2, 1]);
    const primero = simulador.obtenerProceso(2);
    expect(primero.obtenerEstado()).toBe(EstadoProceso.NUEVO);
    expect(primero.obtenerMemoriaRequerida()).toBe(30);
    expect(primero.obtenerCpuTotal()).toBe(4);
    expect(primero.obtenerCpuRestante()).toBe(4);
    expect(primero.obtenerQuantumConsumido()).toBe(0);
    expect(primero.obtenerBloqueoRestante()).toBe(0);
  });

  it("registrar no asigna memoria ni cambia el reloj", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 4);
    expect(simulador.obtenerTickActual()).toBe(0);
    expect(simulador.obtenerMapaMemoria()).toHaveLength(1);
    expect(simulador.obtenerMapaMemoria()[0].estaLibre()).toBe(true);
  });

  it.each([
    [0, 10, 1],
    [-1, 10, 1],
    [1, 0, 1],
    [1, 10, -2],
    [1.5, 10, 1],
    [1, 10, 2.5],
  ])("rechaza datos inválidos (%d, %d, %d)", (pid, memoria, cpu) => {
    const simulador = crearSimulador(100, 2);
    expect(() => simulador.registrarProceso(pid, memoria, cpu)).toThrow();
    expect(simulador.obtenerProcesos()).toHaveLength(0);
  });

  it("rechaza un PID duplicado sin alterar el proceso original", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 3);
    expect(() => simulador.registrarProceso(1, 20, 5)).toThrow();
    expect(simulador.obtenerProcesos()).toHaveLength(1);
    expect(simulador.obtenerProceso(1).obtenerMemoriaRequerida()).toBe(10);
  });

  it("rechaza un pedido mayor a la memoria total y acepta uno igual", () => {
    const simulador = crearSimulador(100, 2);
    expect(() => simulador.registrarProceso(1, 101, 3)).toThrow();
    expect(simulador.obtenerProcesos()).toHaveLength(0);
    simulador.registrarProceso(2, 100, 3);
    expect(simulador.obtenerProcesos()).toHaveLength(1);
  });

  it("consultar un proceso inexistente falla", () => {
    expect(() => crearSimulador(100, 2).obtenerProceso(9)).toThrow();
  });

  it("la lista de procesos es una copia: modificarla no altera el simulador", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 3);
    (simulador.obtenerProcesos() as VistaProceso[]).pop();
    expect(simulador.obtenerProcesos()).toHaveLength(1);
  });
});

describe("Simulador - admisión y asignación (RF03, RF04)", () => {
  it("el primer tick admite a los procesos: parte el bloque libre y los deja Ejecutando o Listo", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 30, 3);
    simulador.registrarProceso(2, 20, 3);
    simulador.avanzarTick();
    const mapa = simulador.obtenerMapaMemoria();
    expect(mapa.map((b) => b.obtenerInicio())).toEqual([0, 30, 50]);
    expect(mapa.map((b) => b.obtenerPidProceso())).toEqual([1, 2, null]);
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.LISTO);
    expect(simulador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
    verificarInvariantes(mapa, 100);
  });

  it("un ajuste exacto ocupa todo el bloque sin dejar uno de tamaño cero", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 100, 2);
    simulador.avanzarTick();
    const mapa = simulador.obtenerMapaMemoria();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].obtenerPidProceso()).toBe(1);
    expect(mapa[0].obtenerTamano()).toBe(100);
  });

  it("sin bloque suficiente el proceso queda Esperando Memoria y el mapa no cambia", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 60, 5);
    simulador.registrarProceso(2, 60, 1);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(simulador.obtenerProcesosEsperandoMemoria().map((v) => v.obtenerPid())).toEqual([2]);
    const mapa = simulador.obtenerMapaMemoria();
    expect(mapa.map((b) => b.obtenerPidProceso())).toEqual([1, null]);
    expect(mapa[1].obtenerTamano()).toBe(40);
  });

  it("reintenta en cada tick y admite al proceso cuando se libera memoria", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 60, 1);
    simulador.registrarProceso(2, 60, 3);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(simulador.obtenerMapaMemoria()).toHaveLength(1);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(simulador.obtenerMapaMemoria()[0].obtenerPidProceso()).toBe(2);
  });

  it("un proceso que no cabe no impide admitir a los que sí caben", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 80, 5);
    simulador.registrarProceso(2, 50, 1);
    simulador.registrarProceso(3, 10, 5);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(simulador.obtenerProceso(3).obtenerEstado()).toBe(EstadoProceso.LISTO);
    expect(simulador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([3]);
  });

  it("al reintentar respeta el orden de registro", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 100, 1);
    simulador.registrarProceso(2, 60, 1);
    simulador.registrarProceso(3, 60, 1);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerProceso(3).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(3).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
  });

  it("un proceso Terminado no vuelve a las colas", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 1);
    [1, 2, 3].forEach(() => simulador.avanzarTick());
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerTerminados().map((v) => v.obtenerPid())).toEqual([1]);
    expect(simulador.obtenerColaListos()).toHaveLength(0);
    expect(simulador.obtenerProcesoEnCpu()).toBeNull();
  });
});

describe("Simulador - avance del reloj (RF06)", () => {
  it("cada invocación avanza exactamente una unidad", () => {
    const simulador = crearSimulador(100, 2);
    [1, 2, 3].forEach((esperado) => {
      simulador.avanzarTick();
      expect(simulador.obtenerTickActual()).toBe(esperado);
    });
  });

  it("sin procesos la CPU queda libre y la utilización es 0%", () => {
    const simulador = crearSimulador(100, 2);
    simulador.avanzarTick();
    simulador.avanzarTick();
    expect(simulador.obtenerProcesoEnCpu()).toBeNull();
    expect(simulador.obtenerMetricas().obtenerUtilizacionCpu()).toBe(0);
  });

  it("una vista tomada antes de avanzar no cambia cuando el proceso avanza", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 3);
    const vista = simulador.obtenerProceso(1);
    simulador.avanzarTick();
    expect(vista.obtenerEstado()).toBe(EstadoProceso.NUEVO);
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
  });
});

// Ejecuta un tick y devuelve el pid del proceso que consumió CPU (null si la CPU quedó libre).
const ejecutarTick = (simulador: Simulador): number | null => {
  const antes = simulador.obtenerProcesos().map((v) => v.obtenerCpuRestante());
  simulador.avanzarTick();
  const despues = simulador.obtenerProcesos();
  const indice = despues.findIndex((v, i) => v.obtenerCpuRestante() < antes[i]);
  return indice === -1 ? null : despues[indice].obtenerPid();
};

const consumoTotal = (simulador: Simulador): number =>
  simulador.obtenerProcesos().reduce((suma, v) => suma + (v.obtenerCpuTotal() - v.obtenerCpuRestante()), 0);

describe("Simulador - orden de fases y Round-Robin (RF06, RF07, RF09)", () => {
  it("Q = 2, P1 con CPU 3 y P2 con CPU 2: ejecutan P1, P1, P2, P2, P1 con un cambio de contexto", () => {
    const simulador = crearSimulador(1024, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.registrarProceso(2, 100, 2);
    const orden = [1, 2, 3, 4, 5].map(() => ejecutarTick(simulador));
    expect(orden).toEqual([1, 1, 2, 2, 1]);
    const metricas = simulador.obtenerMetricas();
    expect(metricas.obtenerCambiosContexto()).toBe(1);
    expect(metricas.obtenerUtilizacionCpu()).toBe(100);
    expect(simulador.obtenerTerminados().map((v) => v.obtenerPid())).toEqual([2, 1]);
  });

  it("al terminar todos los procesos queda un único bloque libre del tamaño total", () => {
    const simulador = crearSimulador(1024, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.registrarProceso(2, 300, 2);
    [1, 2, 3, 4, 5].forEach(() => simulador.avanzarTick());
    const mapa = simulador.obtenerMapaMemoria();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].estaLibre()).toBe(true);
    expect(mapa[0].obtenerTamano()).toBe(1024);
    expect(simulador.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
  });

  it("un único proceso renueva su quantum sin cambio de contexto", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 6);
    [1, 2].forEach(() => simulador.avanzarTick());
    const enCpu = simulador.obtenerProcesoEnCpu();
    expect(enCpu?.obtenerPid()).toBe(1);
    expect(enCpu?.obtenerQuantumConsumido()).toBe(0);
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
    [3, 4].forEach(() => simulador.avanzarTick());
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
    expect(simulador.obtenerProceso(1).obtenerCpuRestante()).toBe(2);
  });

  it("finalizar en el límite del quantum no reencola y no cuenta cambio de contexto", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 2);
    simulador.registrarProceso(2, 10, 2);
    [1, 2].forEach(() => simulador.avanzarTick());
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
    expect(simulador.obtenerProcesoEnCpu()).toBeNull();
    expect(simulador.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
    expect(ejecutarTick(simulador)).toBe(2);
  });

  it("otro proceso se ejecuta recién en el tick siguiente al que termina uno", () => {
    const simulador = crearSimulador(100, 5);
    simulador.registrarProceso(1, 10, 1);
    simulador.registrarProceso(2, 10, 3);
    expect(ejecutarTick(simulador)).toBe(1);
    expect(simulador.obtenerProceso(2).obtenerCpuRestante()).toBe(3);
    expect(ejecutarTick(simulador)).toBe(2);
  });

  it("como máximo un proceso consume una unidad de CPU por tick", () => {
    const simulador = crearSimulador(100, 2);
    [[1, 10, 4], [2, 10, 3], [3, 10, 5]].forEach(([pid, memoria, cpu]) => {
      simulador.registrarProceso(pid, memoria, cpu);
    });
    for (let i = 0; i < 14; i++) {
      const antes = consumoTotal(simulador);
      simulador.avanzarTick();
      expect(consumoTotal(simulador) - antes).toBeLessThanOrEqual(1);
    }
    expect(consumoTotal(simulador)).toBe(12);
  });

  it("la admisión ocurre antes del despacho: un proceso se ejecuta en el mismo tick en que se admite", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 10, 3);
    expect(ejecutarTick(simulador)).toBe(1);
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
  });

  it("una liberación al final del tick habilita la admisión recién en el tick siguiente", () => {
    const simulador = crearSimulador(100, 2);
    simulador.registrarProceso(1, 60, 1);
    simulador.registrarProceso(2, 60, 3);
    simulador.avanzarTick();
    expect(simulador.obtenerProceso(1).obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(simulador.obtenerMapaMemoria()[0].estaLibre()).toBe(true);
    expect(simulador.obtenerProceso(2).obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    expect(ejecutarTick(simulador)).toBe(2);
  });

  it("las métricas se recalculan al finalizar cada tick", () => {
    const simulador = crearSimulador(1000, 2);
    simulador.registrarProceso(1, 250, 2);
    expect(simulador.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
    simulador.avanzarTick();
    expect(simulador.obtenerMetricas().obtenerOcupacionMemoria()).toBe(25);
    expect(simulador.obtenerMetricas().obtenerUtilizacionCpu()).toBe(100);
    simulador.avanzarTick();
    expect(simulador.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
    simulador.avanzarTick();
    expect(simulador.obtenerMetricas().obtenerUtilizacionCpu()).toBeCloseTo((100 * 2) / 3);
  });
});
