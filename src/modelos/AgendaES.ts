import type { ProveedorEventosES } from "../interfaces/ProveedorEventosES";
import type { EventoES } from "./EventoES";

/**
 * Agenda de eventos de E/S por proceso. Valida cada evento al registrarlo y
 * responde al planificador a través del contrato ProveedorEventosES.
 */
export class AgendaES implements ProveedorEventosES {
  private readonly _eventosPorPid: Map<number, EventoES[]> = new Map();

  /**
   * Registra un evento para un proceso. Se rechaza si nunca se dispararía
   * (el proceso termina antes) o si ya hay un evento en ese mismo punto.
   */
  definirEvento(pid: number, cpuTotal: number, evento: EventoES): void {
    if (evento.obtenerCpuConsumida() >= cpuTotal) {
      throw new Error(
        `El evento nunca se dispararía: el proceso ${pid} termina al consumir ${cpuTotal} ticks de CPU`,
      );
    }
    if (this.buscarDuracionBloqueo(pid, evento.obtenerCpuConsumida()) !== null) {
      throw new Error(`El proceso ${pid} ya tiene un evento de E/S en ese punto`);
    }
    this._eventosPorPid.set(pid, [...this.obtenerEventos(pid), evento]);
  }

  /** Copia de los eventos del proceso (los eventos son inmutables). */
  obtenerEventos(pid: number): readonly EventoES[] {
    return [...(this._eventosPorPid.get(pid) ?? [])];
  }

  buscarDuracionBloqueo(pid: number, cpuConsumida: number): number | null {
    const evento = this.obtenerEventos(pid).find((e) => e.obtenerCpuConsumida() === cpuConsumida);
    return evento?.obtenerDuracion() ?? null;
  }
}