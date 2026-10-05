import { Simulador } from "../../src/modelos/Simulador";
import { ConfiguracionSimulador } from "../../src/modelos/ConfiguracionSimulador";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import type { VistaProceso } from "../../src/modelos/VistaProceso";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";
import { verificarInvariantesSistema } from "./invariantesSistema";

describe("Simulador - invariantes del sistema (RF10)", () => {
  // Escenario con espera de memoria, bloqueo por E/S, expulsiones y un pedido igual a la memoria total.
  const crearEscenario = (politica: NombrePolitica): Simulador => {
    const simulador = new Simulador(new ConfiguracionSimulador(100, 2, politica));
    [[1, 40, 4], [2, 40, 3], [3, 30, 2], [4, 20, 1], [5, 100, 2]].forEach(([pid, memoria, cpu]) => {
      simulador.registrarProceso(pid, memoria, cpu);
    });
    simulador.definirEventoES(1, 2, 2);
    return simulador;
  };

  it.each(Object.values(NombrePolitica))(
    "con %s mantiene las invariantes en cada tick hasta terminar todos los procesos",
    (politica) => {
      const simulador = crearEscenario(politica);
      let ticks = 0;
      while (simulador.obtenerTerminados().length < 5 && ticks < 200) {
        simulador.avanzarTick();
        ticks++;
        verificarInvariantesSistema(simulador, 100);
      }
      expect(simulador.obtenerTerminados()).toHaveLength(5);
      expect(simulador.obtenerProcesos().every((v) => v.obtenerEstado() === EstadoProceso.TERMINADO)).toBe(true);
      const mapa = simulador.obtenerMapaMemoria();
      expect(mapa).toHaveLength(1);
      expect(mapa[0].obtenerTamano()).toBe(100);
      expect(simulador.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
      expect(simulador.obtenerTickActual()).toBe(ticks);
    },
  );

  it("el estado consultable no permite alterar el simulador desde afuera", () => {
    const simulador = crearEscenario(NombrePolitica.FIRST_FIT);
    simulador.avanzarTick();
    const antes = simulador.obtenerColaListos().length;
    (simulador.obtenerColaListos() as VistaProceso[]).length = 0;
    (simulador.obtenerBloqueados() as VistaProceso[]).length = 0;
    (simulador.obtenerProcesos() as VistaProceso[]).length = 0;
    expect(simulador.obtenerColaListos()).toHaveLength(antes);
    expect(simulador.obtenerProcesos()).toHaveLength(5);
    verificarInvariantesSistema(simulador, 100);
  });
});