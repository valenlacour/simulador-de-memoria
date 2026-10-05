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