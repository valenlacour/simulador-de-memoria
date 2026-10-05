import { ColaBloqueados } from "../../src/modelos/ColaBloqueados";
import { Proceso } from "../../src/modelos/Proceso";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import type { VistaProceso } from "../../src/modelos/VistaProceso";

// Proceso con CPU total 5 que ejecutó un tick y se bloqueó por E/S.
const crearBloqueado = (pid: number, duracion: number): Proceso => {
  const proceso = new Proceso(pid, 10, 5);
  proceso.admitir();
  proceso.despachar();
  proceso.ejecutarTick();
  proceso.bloquear(duracion);
  return proceso;
};

describe("ColaBloqueados - alta y consulta (RF08)", () => {
  it("inicia vacía", () => {
    const cola = new ColaBloqueados();
    expect(cola.obtenerBloqueados()).toHaveLength(0);
    expect(cola.contiene(1)).toBe(false);
  });

  it("agrega procesos bloqueados en el orden en que se bloquearon", () => {
    const cola = new ColaBloqueados();
    cola.agregar(crearBloqueado(2, 3));
    cola.agregar(crearBloqueado(1, 3));
    expect(cola.obtenerBloqueados().map((v) => v.obtenerPid())).toEqual([2, 1]);
    expect(cola.contiene(1)).toBe(true);
  });

  it("rechaza un proceso que no está BLOQUEADO", () => {
    const cola = new ColaBloqueados();
    const listo = new Proceso(1, 10, 5);
    listo.admitir();
    expect(() => cola.agregar(listo)).toThrow();
    expect(cola.obtenerBloqueados()).toHaveLength(0);
  });

  it("rechaza agregar dos veces el mismo proceso", () => {
    const cola = new ColaBloqueados();
    const proceso = crearBloqueado(1, 3);
    cola.agregar(proceso);
    expect(() => cola.agregar(proceso)).toThrow();
    expect(cola.obtenerBloqueados()).toHaveLength(1);
  });

  it("obtenerBloqueados devuelve copias: modificarlas no altera la cola", () => {
    const cola = new ColaBloqueados();
    cola.agregar(crearBloqueado(1, 3));
    (cola.obtenerBloqueados() as VistaProceso[]).pop();
    expect(cola.obtenerBloqueados()).toHaveLength(1);
    expect(cola.obtenerBloqueados()[0].obtenerEstado()).toBe(EstadoProceso.BLOQUEADO);
  });
});
describe("ColaBloqueados - avanzar (RF06 fase 2, RF08)", () => {
  it("sin bloqueados no libera a nadie", () => {
    expect(new ColaBloqueados().avanzar()).toEqual([]);
  });

  it("reduce el temporizador y libera al proceso cuando llega a cero", () => {
    const cola = new ColaBloqueados();
    const proceso = crearBloqueado(1, 2);
    cola.agregar(proceso);
    expect(cola.avanzar()).toEqual([]);
    expect(proceso.obtenerBloqueoRestante()).toBe(1);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.BLOQUEADO);
    expect(cola.avanzar()).toEqual([1]);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.LISTO);
    expect(cola.contiene(1)).toBe(false);
    expect(cola.obtenerBloqueados()).toHaveLength(0);
  });

  it("un bloqueo de 1 tick vuelve a Listo en la primera actualización", () => {
    const cola = new ColaBloqueados();
    const proceso = crearBloqueado(1, 1);
    cola.agregar(proceso);
    expect(cola.avanzar()).toEqual([1]);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("libera varios procesos en el orden en que se bloquearon y deja a los demás", () => {
    const cola = new ColaBloqueados();
    cola.agregar(crearBloqueado(2, 1));
    cola.agregar(crearBloqueado(3, 3));
    cola.agregar(crearBloqueado(1, 1));
    expect(cola.avanzar()).toEqual([2, 1]);
    expect(cola.obtenerBloqueados().map((v) => v.obtenerPid())).toEqual([3]);
    expect(cola.obtenerBloqueados()[0].obtenerBloqueoRestante()).toBe(2);
  });

  it("durante el bloqueo el proceso no consume CPU", () => {
    const cola = new ColaBloqueados();
    const proceso = crearBloqueado(1, 3);
    cola.agregar(proceso);
    cola.avanzar();
    cola.avanzar();
    expect(proceso.obtenerCpuRestante()).toBe(4);
  });
});
