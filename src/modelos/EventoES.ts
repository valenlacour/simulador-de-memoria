/**
 * Evento determinista de E/S: se dispara cuando el proceso consumió cierta
 * cantidad de ticks de CPU y lo bloquea durante una duración. Es inmutable.
 */
export class EventoES {
  private readonly _cpuConsumida: number;
  private readonly _duracion: number;

  constructor(cpuConsumida: number, duracion: number) {
    EventoES.exigirEnteroPositivo(cpuConsumida, "cpuConsumida");
    EventoES.exigirEnteroPositivo(duracion, "duracion");
    this._cpuConsumida = cpuConsumida;
    this._duracion = duracion;
  }

  obtenerCpuConsumida(): number {
    return this._cpuConsumida;
  }

  obtenerDuracion(): number {
    return this._duracion;
  }

  private static exigirEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }
}