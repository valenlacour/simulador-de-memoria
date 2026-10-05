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
describe("RecolectorMetricas - registrarTick (RF09)", () => {
  const crear = () => {
    const memoria = new Memoria(1000, new PrimerAjuste());
    return { memoria, recolector: new RecolectorMetricas(memoria) };
  };

  it("utilización de CPU: 100 × ticks con CPU ocupada / ticks transcurridos", () => {
    const { recolector } = crear();
    [ResultadoCpu.CONTINUA, ResultadoCpu.SIN_PROCESO, ResultadoCpu.CONTINUA, ResultadoCpu.SIN_PROCESO]
      .forEach((resultado) => recolector.registrarTick(resultado));
    expect(recolector.obtenerMetricas().obtenerUtilizacionCpu()).toBe(50);
  });

  it("un primer tick con la CPU libre da 0% y con la CPU ocupada da 100%", () => {
    const libre = crear().recolector;
    libre.registrarTick(ResultadoCpu.SIN_PROCESO);
    expect(libre.obtenerMetricas().obtenerUtilizacionCpu()).toBe(0);
    const ocupada = crear().recolector;
    ocupada.registrarTick(ResultadoCpu.FINALIZO);
    expect(ocupada.obtenerMetricas().obtenerUtilizacionCpu()).toBe(100);
  });

  it.each([ResultadoCpu.EXPULSION, ResultadoCpu.BLOQUEO])("%s cuenta como cambio de contexto", (resultado) => {
    const { recolector } = crear();
    recolector.registrarTick(resultado);
    expect(recolector.obtenerMetricas().obtenerCambiosContexto()).toBe(1);
  });

  it.each([
    ResultadoCpu.CONTINUA,
    ResultadoCpu.RENOVACION_QUANTUM,
    ResultadoCpu.FINALIZO,
    ResultadoCpu.SIN_PROCESO,
  ])("%s no cuenta como cambio de contexto", (resultado) => {
    const { recolector } = crear();
    recolector.registrarTick(resultado);
    expect(recolector.obtenerMetricas().obtenerCambiosContexto()).toBe(0);
  });

  it("acumula los cambios de contexto tick a tick", () => {
    const { recolector } = crear();
    [ResultadoCpu.CONTINUA, ResultadoCpu.EXPULSION, ResultadoCpu.CONTINUA, ResultadoCpu.BLOQUEO]
      .forEach((resultado) => recolector.registrarTick(resultado));
    expect(recolector.obtenerMetricas().obtenerCambiosContexto()).toBe(2);
  });

  it("recalcula las métricas de memoria al finalizar el tick", () => {
    const { memoria, recolector } = crear();
    memoria.asignar(1, 250);
    expect(recolector.obtenerMetricas().obtenerOcupacionMemoria()).toBe(0);
    recolector.registrarTick(ResultadoCpu.SIN_PROCESO);
    const metricas = recolector.obtenerMetricas();
    expect(metricas.obtenerOcupacionMemoria()).toBe(25);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(750);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(750);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
  });

  it("huecos no contiguos de 100 y 300 KB: libre 400, mayor hueco 300 y fragmentación 25%", () => {
    const { memoria, recolector } = crear();
    [[1, 100], [2, 100], [3, 300], [4, 100], [5, 400]].forEach(([pid, tamano]) => {
      memoria.asignar(pid, tamano);
    });
    memoria.liberar(1);
    memoria.liberar(3);
    recolector.registrarTick(ResultadoCpu.SIN_PROCESO);
    const metricas = recolector.obtenerMetricas();
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(400);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(300);
    expect(metricas.obtenerFragmentacionExterna()).toBe(25);
    expect(metricas.obtenerOcupacionMemoria()).toBe(60);
  });

  it("memoria llena: sin bloques libres y fragmentación 0%", () => {
    const { memoria, recolector } = crear();
    memoria.asignar(1, 1000);
    recolector.registrarTick(ResultadoCpu.CONTINUA);
    const metricas = recolector.obtenerMetricas();
    expect(metricas.obtenerOcupacionMemoria()).toBe(100);
    expect(metricas.obtenerMemoriaLibreTotal()).toBe(0);
    expect(metricas.obtenerMayorBloqueLibre()).toBe(0);
    expect(metricas.obtenerFragmentacionExterna()).toBe(0);
  });

  it("cada tick genera un objeto nuevo: las métricas anteriores no cambian", () => {
    const { recolector } = crear();
    const anteriores = recolector.obtenerMetricas();
    recolector.registrarTick(ResultadoCpu.BLOQUEO);
    expect(anteriores.obtenerCambiosContexto()).toBe(0);
    expect(recolector.obtenerMetricas()).not.toBe(anteriores);
  });
});
