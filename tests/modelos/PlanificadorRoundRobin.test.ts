import { PlanificadorRoundRobin } from "../../src/modelos/PlanificadorRoundRobin";
import { Proceso } from "../../src/modelos/Proceso";
import { ResultadoCpu } from "../../src/modelos/ResultadoEjecucion";
import type { VistaProceso } from "../../src/modelos/VistaProceso";
import type { ProveedorEventosES } from "../../src/interfaces/ProveedorEventosES";
import { EstadoProceso } from "../../src/modelos/EstadoProceso";

const sinEventos: ProveedorEventosES = { buscarDuracionBloqueo: () => null };

const crearListo = (pid: number, cpu: number): Proceso => {
  const proceso = new Proceso(pid, 10, cpu);
  proceso.admitir();
  return proceso;
};

describe("PlanificadorRoundRobin - creación y cola (RF07)", () => {
  it("inicia con la CPU libre y la cola vacía", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    expect(planificador.obtenerQuantum()).toBe(2);
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
    expect(planificador.obtenerColaListos()).toHaveLength(0);
  });

  it.each([0, -1, 1.5, NaN])("rechaza un quantum inválido (%d)", (quantum) => {
    expect(() => new PlanificadorRoundRobin(quantum, sinEventos)).toThrow();
  });

  it("encola en orden FIFO", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    [1, 2, 3].forEach((pid) => planificador.encolar(crearListo(pid, 3)));
    expect(planificador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([1, 2, 3]);
  });

  it("rechaza encolar un proceso que no está LISTO", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    expect(() => planificador.encolar(new Proceso(1, 10, 3))).toThrow();
    expect(planificador.obtenerColaListos()).toHaveLength(0);
  });

  it("rechaza encolar dos veces el mismo proceso", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 3));
    expect(() => planificador.encolar(crearListo(1, 3))).toThrow();
    expect(planificador.obtenerColaListos()).toHaveLength(1);
  });

  it("obtenerColaListos devuelve una copia: modificarla no altera el planificador", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 3));
    (planificador.obtenerColaListos() as VistaProceso[]).pop();
    expect(planificador.obtenerColaListos()).toHaveLength(1);
  });
});