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

describe("Proceso - ejecución (RF07)", () => {
  const crearListo = () => {
    const p = new Proceso(1, 100, 3);
    p.admitir();
    return p;
  };

  it("despachar pasa a EJECUTANDO y reinicia el quantum", () => {
    const p = crearListo();
    p.despachar();
    expect(p.obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(p.obtenerQuantumConsumido()).toBe(0);
  });

  it("ejecutar un tick consume CPU y quantum", () => {
    const p = crearListo();
    p.despachar();
    p.ejecutarTick();
    expect(p.obtenerCpuRestante()).toBe(2);
    expect(p.obtenerQuantumConsumido()).toBe(1);
  });

  it("renovar el quantum lo reinicia sin cambiar el estado", () => {
    const p = crearListo();
    p.despachar();
    p.ejecutarTick();
    p.renovarQuantum();
    expect(p.obtenerQuantumConsumido()).toBe(0);
    expect(p.obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
  });

  it("expulsar vuelve a LISTO", () => {
    const p = crearListo();
    p.despachar();
    p.expulsar();
    expect(p.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("no se puede despachar ni ejecutar fuera de estado", () => {
    const p = new Proceso(1, 100, 3);
    expect(() => p.despachar()).toThrow();
    expect(() => p.ejecutarTick()).toThrow();
    expect(() => p.renovarQuantum()).toThrow();
  });
});

describe("Proceso - bloqueo por E/S (RF08)", () => {
  const crearEjecutando = () => {
    const p = new Proceso(1, 100, 5);
    p.admitir();
    p.despachar();
    return p;
  };

  it("bloquear guarda la duración y pasa a BLOQUEADO", () => {
    const p = crearEjecutando();
    p.bloquear(2);
    expect(p.obtenerEstado()).toBe(EstadoProceso.BLOQUEADO);
    expect(p.obtenerBloqueoRestante()).toBe(2);
  });

  it("avanzarBloqueo informa cuándo termina el bloqueo", () => {
    const p = crearEjecutando();
    p.bloquear(2);
    expect(p.avanzarBloqueo()).toBe(false);
    expect(p.avanzarBloqueo()).toBe(true);
  });

  it("desbloquear vuelve a LISTO", () => {
    const p = crearEjecutando();
    p.bloquear(1);
    p.avanzarBloqueo();
    p.desbloquear();
    expect(p.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("rechaza una duración inválida y el bloqueo fuera de la CPU", () => {
    expect(() => crearEjecutando().bloquear(0)).toThrow();
    const listo = new Proceso(2, 10, 1);
    listo.admitir();
    expect(() => listo.bloquear(1)).toThrow();
  });

  it("no avanza el bloqueo de un proceso que no está bloqueado", () => {
    expect(() => crearEjecutando().avanzarBloqueo()).toThrow();
  });
});
