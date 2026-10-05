import { Simulador } from "../../src/modelos/Simulador";
import { ConfiguracionSimulador } from "../../src/modelos/ConfiguracionSimulador";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";
import { verificarInvariantesSistema } from "./invariantesSistema";

/**
 * Comparación de las tres políticas con la misma carga de trabajo (consigna de Sistemas
 * Operativos, puntos 6 y 16 a 18). Cada escenario parte del mismo mapa con dos huecos no
 * contiguos y registra los mismos pedidos; solo cambia la política elegida al configurar.
 */

type Bloque = [number, number, number | null];

const MEMORIA = 100;
const CPU_LARGA = 20;

const describirMapa = (simulador: Simulador): Bloque[] =>
  simulador
    .obtenerMapaMemoria()
    .map((b) => [b.obtenerInicio(), b.obtenerTamano(), b.obtenerPidProceso()]);

/**
 * Deja la memoria con un hueco de `hueco1` KB en la dirección 0 y otro de `hueco2` KB
 * separados por P2 (10 KB), con P4 ocupando el resto. Con quantum 1, P1 termina en el
 * tick 1 y P3 en el tick 3; P2 y P4 siguen en memoria.
 */
const prepararHuecos = (
  politica: NombrePolitica,
  hueco1: number,
  hueco2: number,
  cpuSeparador: number = CPU_LARGA,
): Simulador => {
  const simulador = new Simulador(new ConfiguracionSimulador(MEMORIA, 1, politica));
  simulador.registrarProceso(1, hueco1, 1);
  simulador.registrarProceso(2, 10, cpuSeparador);
  simulador.registrarProceso(3, hueco2, 1);
  simulador.registrarProceso(4, MEMORIA - hueco1 - 10 - hueco2, CPU_LARGA);
  [1, 2, 3].forEach(() => simulador.avanzarTick());
  return simulador;
};

/** Registra los pedidos (PID 5 en adelante) y avanza un tick para que se intente admitirlos. */
const pedir = (simulador: Simulador, tamanos: number[]): void => {
  tamanos.forEach((tamano, i) => simulador.registrarProceso(5 + i, tamano, CPU_LARGA));
  simulador.avanzarTick();
};

const esperando = (simulador: Simulador): number[] =>
  simulador.obtenerProcesosEsperandoMemoria().map((v) => v.obtenerPid());

describe("Comparación de políticas con la misma carga", () => {
  it.each([NombrePolitica.FIRST_FIT, NombrePolitica.BEST_FIT, NombrePolitica.WORST_FIT])(
    "el punto de partida es el mismo para %s: huecos de 30 KB en 0 y de 20 KB en 40",
    (politica) => {
      const simulador = prepararHuecos(politica, 30, 20);
      expect(describirMapa(simulador)).toEqual([
        [0, 30, null],
        [30, 10, 2],
        [40, 20, null],
        [60, 40, 4],
      ]);
      expect(simulador.obtenerMetricas().obtenerMemoriaLibreTotal()).toBe(50);
      expect(simulador.obtenerMetricas().obtenerFragmentacionExterna()).toBe(40);
    },
  );

  // Huecos 30 y 20, pedidos de 20 y 30 KB: Best-Fit usa cada hueco de forma exacta.
  it.each<[NombrePolitica, Bloque[], number[], number, number, number]>([
    [
      NombrePolitica.FIRST_FIT,
      [[0, 20, 5], [20, 10, null], [30, 10, 2], [40, 20, null], [60, 40, 4]],
      [6], 30, 20, 100 / 3,
    ],
    [
      NombrePolitica.BEST_FIT,
      [[0, 30, 6], [30, 10, 2], [40, 20, 5], [60, 40, 4]],
      [], 0, 0, 0,
    ],
    [
      NombrePolitica.WORST_FIT,
      [[0, 20, 5], [20, 10, null], [30, 10, 2], [40, 20, null], [60, 40, 4]],
      [6], 30, 20, 100 / 3,
    ],
  ])(
    "pedidos de 20 y 30 KB con %s: solo Best-Fit admite a ambos",
    (politica, mapa, enEspera, libre, mayor, fragmentacion) => {
      const simulador = prepararHuecos(politica, 30, 20);
      pedir(simulador, [20, 30]);
      expect(describirMapa(simulador)).toEqual(mapa);
      expect(esperando(simulador)).toEqual(enEspera);
      const metricas = simulador.obtenerMetricas();
      expect(metricas.obtenerMemoriaLibreTotal()).toBe(libre);
      expect(metricas.obtenerMayorBloqueLibre()).toBe(mayor);
      expect(metricas.obtenerFragmentacionExterna()).toBeCloseTo(fragmentacion);
    },
  );

  // Huecos 30 y 20, pedidos de 15, 15 y 20 KB: First-Fit llena el primer hueco y deja el segundo entero.
  it.each<[NombrePolitica, Bloque[], number[], number, number, number]>([
    [
      NombrePolitica.FIRST_FIT,
      [[0, 15, 5], [15, 15, 6], [30, 10, 2], [40, 20, 7], [60, 40, 4]],
      [], 0, 0, 0,
    ],
    [
      NombrePolitica.BEST_FIT,
      [[0, 15, 6], [15, 15, null], [30, 10, 2], [40, 15, 5], [55, 5, null], [60, 40, 4]],
      [7], 20, 15, 25,
    ],
    [
      NombrePolitica.WORST_FIT,
      [[0, 15, 5], [15, 15, null], [30, 10, 2], [40, 15, 6], [55, 5, null], [60, 40, 4]],
      [7], 20, 15, 25,
    ],
  ])(
    "pedidos de 15, 15 y 20 KB con %s: solo First-Fit admite a todos",
    (politica, mapa, enEspera, libre, mayor, fragmentacion) => {
      const simulador = prepararHuecos(politica, 30, 20);
      pedir(simulador, [15, 15, 20]);
      expect(describirMapa(simulador)).toEqual(mapa);
      expect(esperando(simulador)).toEqual(enEspera);
      const metricas = simulador.obtenerMetricas();
      expect(metricas.obtenerMemoriaLibreTotal()).toBe(libre);
      expect(metricas.obtenerMayorBloqueLibre()).toBe(mayor);
      expect(metricas.obtenerFragmentacionExterna()).toBeCloseTo(fragmentacion);
    },
  );

  // Huecos 20 y 30, pedidos de 5, 20 y 20 KB: Worst-Fit no rompe el hueco chico y lo usa al final.
  it.each<[NombrePolitica, Bloque[], number[], number, number, number]>([
    [
      NombrePolitica.FIRST_FIT,
      [[0, 5, 5], [5, 15, null], [20, 10, 2], [30, 20, 6], [50, 10, null], [60, 40, 4]],
      [7], 25, 15, 40,
    ],
    [
      NombrePolitica.BEST_FIT,
      [[0, 5, 5], [5, 15, null], [20, 10, 2], [30, 20, 6], [50, 10, null], [60, 40, 4]],
      [7], 25, 15, 40,
    ],
    [
      NombrePolitica.WORST_FIT,
      [[0, 20, 7], [20, 10, 2], [30, 5, 5], [35, 20, 6], [55, 5, null], [60, 40, 4]],
      [], 5, 5, 0,
    ],
  ])(
    "pedidos de 5, 20 y 20 KB con %s: solo Worst-Fit admite a todos",
    (politica, mapa, enEspera, libre, mayor, fragmentacion) => {
      const simulador = prepararHuecos(politica, 20, 30);
      pedir(simulador, [5, 20, 20]);
      expect(describirMapa(simulador)).toEqual(mapa);
      expect(esperando(simulador)).toEqual(enEspera);
      const metricas = simulador.obtenerMetricas();
      expect(metricas.obtenerMemoriaLibreTotal()).toBe(libre);
      expect(metricas.obtenerMayorBloqueLibre()).toBe(mayor);
      expect(metricas.obtenerFragmentacionExterna()).toBeCloseTo(fragmentacion);
    },
  );

  it("con fragmentación externa un pedido espera aunque la memoria libre total alcance", () => {
    const simulador = prepararHuecos(NombrePolitica.FIRST_FIT, 30, 20);
    pedir(simulador, [20, 30]);
    expect(simulador.obtenerMetricas().obtenerMemoriaLibreTotal()).toBe(30);
    expect(simulador.obtenerMetricas().obtenerMayorBloqueLibre()).toBe(20);
    expect(simulador.obtenerProceso(6).obtenerMemoriaRequerida()).toBe(30);
    expect(esperando(simulador)).toEqual([6]);
  });

  it("al liberarse el bloque que separa dos huecos, la coalescencia elimina la fragmentación y admite al que esperaba", () => {
    const simulador = prepararHuecos(NombrePolitica.FIRST_FIT, 30, 20, 2);
    pedir(simulador, [20, 30]);
    expect(simulador.obtenerMetricas().obtenerFragmentacionExterna()).toBeCloseTo(100 / 3);
    expect(esperando(simulador)).toEqual([6]);

    while (simulador.obtenerProceso(2).obtenerEstado() !== EstadoProceso.TERMINADO) {
      simulador.avanzarTick();
    }
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 5],
      [20, 40, null],
      [60, 40, 4],
    ]);
    expect(simulador.obtenerMetricas().obtenerFragmentacionExterna()).toBe(0);
    expect(esperando(simulador)).toEqual([6]);

    simulador.avanzarTick();
    expect(esperando(simulador)).toHaveLength(0);
    expect(describirMapa(simulador)).toEqual([
      [0, 20, 5],
      [20, 30, 6],
      [50, 10, null],
      [60, 40, 4],
    ]);
    verificarInvariantesSistema(simulador, MEMORIA);
  });
});