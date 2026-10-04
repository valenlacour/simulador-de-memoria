import { EstadoProceso } from "./EstadoProceso";

export class Proceso {
  private readonly _pid: number;
  private readonly _memoriaRequerida: number;
  private readonly _cpuTotal: number;
  private _cpuRestante: number;
  private _estado: EstadoProceso = EstadoProceso.NUEVO;
  private _quantumConsumido: number = 0;
  private _bloqueoRestante: number = 0;

  constructor(pid: number, memoriaRequerida: number, cpuTotal: number) {
    Proceso.exigirEnteroPositivo(pid, "pid");
    Proceso.exigirEnteroPositivo(memoriaRequerida, "memoriaRequerida");
    Proceso.exigirEnteroPositivo(cpuTotal, "cpuTotal");
    this._pid = pid;
    this._memoriaRequerida = memoriaRequerida;
    this._cpuTotal = cpuTotal;
    this._cpuRestante = cpuTotal;
  }

  obtenerPid(): number {
    return this._pid;
  }

  obtenerMemoriaRequerida(): number {
    return this._memoriaRequerida;
  }

  obtenerCpuTotal(): number {
    return this._cpuTotal;
  }

  obtenerCpuRestante(): number {
    return this._cpuRestante;
  }

  obtenerEstado(): EstadoProceso {
    return this._estado;
  }

  obtenerQuantumConsumido(): number {
    return this._quantumConsumido;
  }

  obtenerBloqueoRestante(): number {
    return this._bloqueoRestante;
  }

  private static exigirEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }

  esperarMemoria(): void {
    this.transicionar([EstadoProceso.NUEVO], EstadoProceso.ESPERANDO_MEMORIA);
  }

  admitir(): void {
    this.transicionar(
      [EstadoProceso.NUEVO, EstadoProceso.ESPERANDO_MEMORIA],
      EstadoProceso.LISTO,
    );
  }

  private transicionar(permitidos: EstadoProceso[], destino: EstadoProceso): void {
    if (!permitidos.includes(this._estado)) {
      throw new Error(`Transición inválida: ${this._estado} -> ${destino}`);
    }
    this._estado = destino;
  }

  despachar(): void {
    this.transicionar([EstadoProceso.LISTO], EstadoProceso.EJECUTANDO);
    this._quantumConsumido = 0;
  }

  ejecutarTick(): void {
    this.exigirEstado(EstadoProceso.EJECUTANDO);
    this._cpuRestante--;
    this._quantumConsumido++;
  }

  renovarQuantum(): void {
    this.exigirEstado(EstadoProceso.EJECUTANDO);
    this._quantumConsumido = 0;
  }

  expulsar(): void {
    this.transicionar([EstadoProceso.EJECUTANDO], EstadoProceso.LISTO);
  }

  private exigirEstado(esperado: EstadoProceso): void {
    if (this._estado !== esperado) {
      throw new Error(`Se esperaba ${esperado} pero está ${this._estado}`);
    }
  }
}
