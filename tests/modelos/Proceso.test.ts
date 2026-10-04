import { Proceso } from "../../src/modelos/Proceso";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";

describe("Proceso - creación (RF02)", () => {
  it("nace NUEVO con la CPU restante igual a la total", () => {
    const p = new Proceso(1, 100, 3);
    expect(p.obtenerPid()).toBe(1);
    expect(p.obtenerMemoriaRequerida()).toBe(100);
    expect(p.obtenerCpuTotal()).toBe(3);
    expect(p.obtenerCpuRestante()).toBe(3);
    expect(p.obtenerEstado()).toBe(EstadoProceso.NUEVO);
    expect(p.obtenerQuantumConsumido()).toBe(0);
    expect(p.obtenerBloqueoRestante()).toBe(0);
  });

  it.each([
    [0, 10, 1],
    [1, -5, 1],
    [1, 10, 0],
    [1.5, 10, 1],
  ])("rechaza datos inválidos (%d, %d, %d)", (pid, memoria, cpu) => {
    expect(() => new Proceso(pid, memoria, cpu)).toThrow();
  });
});
describe("Proceso - admisión (RF03)", () => {
  it("un proceso NUEVO pasa a LISTO al admitirse", () => {
    const p = new Proceso(1, 100, 3);
    p.admitir();
    expect(p.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("un proceso NUEVO puede esperar memoria y luego admitirse", () => {
    const p = new Proceso(1, 100, 3);
    p.esperarMemoria();
    expect(p.obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    p.admitir();
    expect(p.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("no puede admitirse dos veces", () => {
    const p = new Proceso(1, 100, 3);
    p.admitir();
    expect(() => p.admitir()).toThrow();
  });
});
