import { RecolectorMetricas } from "../../src/modelos/RecolectorMetricas";
import { Memoria } from "../../src/modelos/Memoria";
import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { ResultadoCpu } from "../../src/modelos/ResultadoEjecucion";

describe("RecolectorMetricas - tick 0 (RF09)", () => {
  it("en el tick 0 todo está en cero y la memoria libre", () => {
    const recolector = new RecolectorMetricas(new Memoria(1024, new PrimerAjuste()));
    const metricas = recolector.obtenerMetricas();
    expect(metricas.obtenerOcupacionMemoria()).toBe(0);
    expect(metricas.obtenerUtilizacionCpu()).toBe(0);
    expect(metricas.obtenerCambiosContexto()).toBe(0);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(1024);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(1024);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
  });

  it("las métricas no cambian hasta que finaliza un tick", () => {
    const memoria = new Memoria(1000, new PrimerAjuste());
    const recolector = new RecolectorMetricas(memoria);
    memoria.asignar(1, 500);
    expect(recolector.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
    expect(ResultadoCpu.SIN_PROCESO).toBeDefined();
  });
});