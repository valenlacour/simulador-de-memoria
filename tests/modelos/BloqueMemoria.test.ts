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
describe("BloqueMemoria - ocupar y liberar (RF04, RF05)", () => {
  it("puedeContener acepta un tamaño menor o igual al del bloque libre", () => {
    const b = new BloqueMemoria(0, 100);
    expect(b.puedeContener(60)).toBe(true);
    expect(b.puedeContener(100)).toBe(true);
    expect(b.puedeContener(101)).toBe(false);
  });

  it("puedeContener rechaza un bloque ocupado aunque sea grande", () => {
    expect(new BloqueMemoria(0, 100, 1).puedeContener(10)).toBe(false);
  });

  it("ocupar devuelve un bloque nuevo y no modifica el original", () => {
    const libre = new BloqueMemoria(10, 40);
    const ocupado = libre.ocupar(3);
    expect(ocupado.obtenerPidProceso()).toBe(3);
    expect(ocupado.obtenerInicio()).toBe(10);
    expect(ocupado.obtenerTamano()).toBe(40);
    expect(libre.estaLibre()).toBe(true);
  });

  it("liberar devuelve un bloque libre con la misma ubicación", () => {
    const ocupado = new BloqueMemoria(10, 40, 3);
    const libre = ocupado.liberar();
    expect(libre.estaLibre()).toBe(true);
    expect(libre.obtenerInicio()).toBe(10);
    expect(libre.obtenerTamano()).toBe(40);
    expect(ocupado.obtenerPidProceso()).toBe(3);
  });

  it("no se puede ocupar un bloque ocupado ni liberar uno libre", () => {
    expect(() => new BloqueMemoria(0, 10, 1).ocupar(2)).toThrow();
    expect(() => new BloqueMemoria(0, 10).liberar()).toThrow();
  });

  it("rechaza ocupar con un pid inválido", () => {
    expect(() => new BloqueMemoria(0, 10).ocupar(0)).toThrow();
  });
});

describe("BloqueMemoria - separar (RF04)", () => {
  it("divide un bloque libre en dos libres contiguos", () => {
    const [primero, resto] = new BloqueMemoria(100, 400).separar(150);
    expect(primero.obtenerInicio()).toBe(100);
    expect(primero.obtenerTamano()).toBe(150);
    expect(resto.obtenerInicio()).toBe(250);
    expect(resto.obtenerTamano()).toBe(250);
    expect(primero.obtenerFin()).toBe(resto.obtenerInicio());
    expect(primero.estaLibre() && resto.estaLibre()).toBe(true);
  });

  it("no genera bloques de tamaño cero: rechaza el tamaño exacto o mayor", () => {
    const b = new BloqueMemoria(0, 100);
    expect(() => b.separar(100)).toThrow();
    expect(() => b.separar(101)).toThrow();
  });

  it("rechaza tamaños inválidos", () => {
    const b = new BloqueMemoria(0, 100);
    expect(() => b.separar(0)).toThrow();
    expect(() => b.separar(-10)).toThrow();
    expect(() => b.separar(2.5)).toThrow();
  });

  it("no separa un bloque ocupado", () => {
    expect(() => new BloqueMemoria(0, 100, 1).separar(10)).toThrow();
  });
});
