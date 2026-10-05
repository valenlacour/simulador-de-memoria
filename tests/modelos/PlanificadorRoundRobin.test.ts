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
describe("PlanificadorRoundRobin - despacho y ejecución (RF06, RF07)", () => {
  it("sin procesos informa SIN_PROCESO y la CPU sigue libre", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    const resultado = planificador.ejecutarTick();
    expect(resultado.obtenerResultado()).toBe(ResultadoCpu.SIN_PROCESO);
    expect(resultado.obtenerPid()).toBeNull();
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
  });

  it("despacha al primero de la cola y ejecuta una unidad de CPU", () => {
    const planificador = new PlanificadorRoundRobin(3, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    const resultado = planificador.ejecutarTick();
    expect(resultado.obtenerResultado()).toBe(ResultadoCpu.CONTINUA);
    expect(resultado.obtenerPid()).toBe(1);
    const enCpu = planificador.obtenerProcesoEnCpu();
    expect(enCpu?.obtenerPid()).toBe(1);
    expect(enCpu?.obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(enCpu?.obtenerCpuRestante()).toBe(4);
    expect(enCpu?.obtenerQuantumConsumido()).toBe(1);
    expect(planificador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
  });

  it("como máximo un proceso consume CPU por tick", () => {
    const planificador = new PlanificadorRoundRobin(3, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    planificador.ejecutarTick();
    const enEspera = planificador.obtenerColaListos()[0];
    expect(enEspera.obtenerCpuRestante()).toBe(5);
    expect(enEspera.obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("mientras no se agota el quantum el mismo proceso sigue en CPU", () => {
    const planificador = new PlanificadorRoundRobin(3, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.ejecutarTick();
    const resultado = planificador.ejecutarTick();
    expect(resultado.obtenerResultado()).toBe(ResultadoCpu.CONTINUA);
    expect(planificador.obtenerProcesoEnCpu()?.obtenerQuantumConsumido()).toBe(2);
  });

  it("un proceso que ya está en CPU no se puede encolar", () => {
    const planificador = new PlanificadorRoundRobin(3, sinEventos);
    const proceso = crearListo(1, 5);
    planificador.encolar(proceso);
    planificador.ejecutarTick();
    expect(() => planificador.encolar(proceso)).toThrow();
  });
});

describe("PlanificadorRoundRobin - quantum (RF07)", () => {
  const ejecutar = (planificador: PlanificadorRoundRobin, ticks: number) =>
    Array.from({ length: ticks }, () => planificador.ejecutarTick());

  it("al agotar el quantum con otros Listos expulsa al proceso al final de la cola", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    const [primero, segundo] = ejecutar(planificador, 2);
    expect(primero.obtenerResultado()).toBe(ResultadoCpu.CONTINUA);
    expect(segundo.obtenerResultado()).toBe(ResultadoCpu.EXPULSION);
    expect(segundo.obtenerPid()).toBe(1);
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
    expect(planificador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2, 1]);
    expect(planificador.obtenerColaListos()[1].obtenerEstado()).toBe(EstadoProceso.LISTO);
  });

  it("tras la expulsión el siguiente proceso se despacha recién en el tick siguiente", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    ejecutar(planificador, 2);
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
    const resultado = planificador.ejecutarTick();
    expect(resultado.obtenerPid()).toBe(2);
    expect(planificador.obtenerProcesoEnCpu()?.obtenerPid()).toBe(2);
  });

  it("al despachar de nuevo reinicia el quantum consumido", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    ejecutar(planificador, 5);
    const enCpu = planificador.obtenerProcesoEnCpu();
    expect(enCpu?.obtenerPid()).toBe(1);
    expect(enCpu?.obtenerQuantumConsumido()).toBe(1);
  });

  it("el orden de ejecución con Q = 2 y dos procesos largos es 1, 1, 2, 2, 1", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    expect(ejecutar(planificador, 5).map((r) => r.obtenerPid())).toEqual([1, 1, 2, 2, 1]);
  });

  it("un único proceso renueva su quantum y sigue en CPU sin cambio de contexto", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 5));
    const [primero, segundo] = ejecutar(planificador, 2);
    expect(primero.obtenerResultado()).toBe(ResultadoCpu.CONTINUA);
    expect(segundo.obtenerResultado()).toBe(ResultadoCpu.RENOVACION_QUANTUM);
    const enCpu = planificador.obtenerProcesoEnCpu();
    expect(enCpu?.obtenerPid()).toBe(1);
    expect(enCpu?.obtenerEstado()).toBe(EstadoProceso.EJECUTANDO);
    expect(enCpu?.obtenerQuantumConsumido()).toBe(0);
    expect(planificador.obtenerColaListos()).toHaveLength(0);
  });

  it("con quantum 1 alterna entre los procesos en cada tick", () => {
    const planificador = new PlanificadorRoundRobin(1, sinEventos);
    planificador.encolar(crearListo(1, 5));
    planificador.encolar(crearListo(2, 5));
    expect(ejecutar(planificador, 4).map((r) => r.obtenerPid())).toEqual([1, 2, 1, 2]);
  });
});

describe("PlanificadorRoundRobin - finalización (RF07)", () => {
  const ejecutar = (planificador: PlanificadorRoundRobin, ticks: number) =>
    Array.from({ length: ticks }, () => planificador.ejecutarTick());

  it("Q = 2, P1 con CPU 3 y P2 con CPU 2: ejecutan P1, P1, P2, P2, P1 con una sola expulsión", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 3));
    planificador.encolar(crearListo(2, 2));
    const resultados = ejecutar(planificador, 5);
    expect(resultados.map((r) => r.obtenerPid())).toEqual([1, 1, 2, 2, 1]);
    expect(resultados.map((r) => r.obtenerResultado())).toEqual([
      ResultadoCpu.CONTINUA,
      ResultadoCpu.EXPULSION,
      ResultadoCpu.CONTINUA,
      ResultadoCpu.FINALIZO,
      ResultadoCpu.FINALIZO,
    ]);
    expect(resultados.filter((r) => r.obtenerResultado() === ResultadoCpu.EXPULSION)).toHaveLength(1);
  });

  it("finalizar libera la CPU y el siguiente proceso corre recién en el tick siguiente", () => {
    const planificador = new PlanificadorRoundRobin(5, sinEventos);
    planificador.encolar(crearListo(1, 1));
    planificador.encolar(crearListo(2, 3));
    const resultado = planificador.ejecutarTick();
    expect(resultado.obtenerResultado()).toBe(ResultadoCpu.FINALIZO);
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
    expect(planificador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
    expect(planificador.ejecutarTick().obtenerPid()).toBe(2);
  });

  it("finalizar en el límite del quantum no reencola al proceso", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 2));
    planificador.encolar(crearListo(2, 3));
    const [, segundo] = ejecutar(planificador, 2);
    expect(segundo.obtenerResultado()).toBe(ResultadoCpu.FINALIZO);
    expect(planificador.obtenerColaListos().map((v) => v.obtenerPid())).toEqual([2]);
  });

  it("un único proceso que termina en el límite del quantum no se renueva", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    planificador.encolar(crearListo(1, 2));
    const resultados = ejecutar(planificador, 3);
    expect(resultados[1].obtenerResultado()).toBe(ResultadoCpu.FINALIZO);
    expect(resultados[2].obtenerResultado()).toBe(ResultadoCpu.SIN_PROCESO);
  });

  it("un proceso TERMINADO no vuelve a la cola ni a la CPU", () => {
    const planificador = new PlanificadorRoundRobin(2, sinEventos);
    const proceso = crearListo(1, 1);
    planificador.encolar(proceso);
    planificador.ejecutarTick();
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.TERMINADO);
    expect(planificador.obtenerColaListos()).toHaveLength(0);
    expect(planificador.obtenerProcesoEnCpu()).toBeNull();
    expect(() => planificador.encolar(proceso)).toThrow();
  });
});
