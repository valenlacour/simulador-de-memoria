import { ResultadoCpu, ResultadoEjecucion } from "../../src/modelos/ResultadoEjecucion";

describe("ResultadoEjecucion", () => {
  it("guarda el resultado y el pid del proceso", () => {
    const r = new ResultadoEjecucion(ResultadoCpu.FINALIZO, 3);
    expect(r.obtenerResultado()).toBe(ResultadoCpu.FINALIZO);
    expect(r.obtenerPid()).toBe(3);
  });

  it("permite no tener proceso (CPU libre)", () => {
    const r = new ResultadoEjecucion(ResultadoCpu.SIN_PROCESO, null);
    expect(r.obtenerResultado()).toBe(ResultadoCpu.SIN_PROCESO);
    expect(r.obtenerPid()).toBeNull();
  });
});