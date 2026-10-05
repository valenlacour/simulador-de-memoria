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
