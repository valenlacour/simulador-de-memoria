import { EstadoProceso } from "../../src/modelos/EstadoProceso";
import type { Simulador } from "../../src/modelos/Simulador";
import { verificarInvariantes } from "./invariantesMemoria";

/**
 * Invariantes del sistema (RF10): cada proceso está en exactamente un lugar, no hay
 * duplicados en las colas, a lo sumo un proceso ejecuta, los estados coinciden con cada
 * cola y la memoria la tienen exactamente los procesos Listos, Ejecutando o Bloqueados.
 * Se usa después del primer tick, cuando ya no quedan procesos NUEVOS.
 */
export function verificarInvariantesSistema(simulador: Simulador, memoriaTotal: number): void {
  const enCpu = simulador.obtenerProcesoEnCpu();
  const listos = simulador.obtenerColaListos();
  const bloqueados = simulador.obtenerBloqueados();
  const esperando = simulador.obtenerProcesosEsperandoMemoria();
  const terminados = simulador.obtenerTerminados();
  const todos = simulador.obtenerProcesos();

  const pids = [
    ...(enCpu === null ? [] : [enCpu.obtenerPid()]),
    ...listos.map((v) => v.obtenerPid()),
    ...bloqueados.map((v) => v.obtenerPid()),
    ...esperando.map((v) => v.obtenerPid()),
    ...terminados.map((v) => v.obtenerPid()),
  ];
  expect(new Set(pids).size).toBe(pids.length);
  expect(pids.length).toBe(todos.length);

  const ejecutando = todos.filter((v) => v.obtenerEstado() === EstadoProceso.EJECUTANDO);
  expect(ejecutando).toHaveLength(enCpu === null ? 0 : 1);

  listos.forEach((v) => expect(v.obtenerEstado()).toBe(EstadoProceso.LISTO));
  bloqueados.forEach((v) => expect(v.obtenerEstado()).toBe(EstadoProceso.BLOQUEADO));
  esperando.forEach((v) => expect(v.obtenerEstado()).toBe(EstadoProceso.ESPERANDO_MEMORIA));
  terminados.forEach((v) => expect(v.obtenerEstado()).toBe(EstadoProceso.TERMINADO));

  const conMemoria = simulador
    .obtenerMapaMemoria()
    .filter((bloque) => !bloque.estaLibre())
    .map((bloque) => bloque.obtenerPidProceso() as number)
    .sort((a, b) => a - b);
  const esperados = todos
    .filter((v) =>
      [EstadoProceso.LISTO, EstadoProceso.EJECUTANDO, EstadoProceso.BLOQUEADO].includes(v.obtenerEstado()),
    )
    .map((v) => v.obtenerPid())
    .sort((a, b) => a - b);
  expect(conMemoria).toEqual(esperados);

  verificarInvariantes(simulador.obtenerMapaMemoria(), memoriaTotal);
}