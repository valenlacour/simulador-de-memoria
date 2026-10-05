import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";

describe("BloqueMemoria - creación (RF04)", () => {
  it("un bloque sin proceso está libre", () => {
    const b = new BloqueMemoria(0, 100);
    expect(b.obtenerInicio()).toBe(0);
    expect(b.obtenerTamano()).toBe(100);
    expect(b.obtenerFin()).toBe(100);
    expect(b.obtenerPidProceso()).toBeNull();
    expect(b.estaLibre()).toBe(true);
  });

  it("un bloque con proceso está ocupado", () => {
    const b = new BloqueMemoria(50, 30, 7);
    expect(b.obtenerPidProceso()).toBe(7);
    expect(b.estaLibre()).toBe(false);
    expect(b.obtenerFin()).toBe(80);
  });

  it.each([
    [-1, 10, null],
    [1.5, 10, null],
    [0, 0, null],
    [0, -5, null],
    [0, 2.5, null],
    [0, 10, 0],
    [0, 10, -3],
    [0, 10, 1.5],
  ])("rechaza datos inválidos (%d, %d, %s)", (inicio, tamano, pid) => {
    expect(() => new BloqueMemoria(inicio, tamano, pid)).toThrow();
  });
});