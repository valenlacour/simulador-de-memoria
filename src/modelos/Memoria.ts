import { BloqueMemoria } from "./BloqueMemoria";
import type { PoliticaAsignacion } from "../interfaces/PoliticaAsignacion";

/**
 * Memoria principal con asignación contigua. Mantiene un mapa ordenado de
 * bloques (libres y ocupados) y preserva sus invariantes: continuidad, tamaño
 * total constante, sin solapamientos y sin bloques libres adyacentes.
 */
export class Memoria {
  private readonly _memoriaTotal: number;
  private readonly _politica: PoliticaAsignacion;
  private readonly _bloques: BloqueMemoria[];

  constructor(memoriaTotal: number, politica: PoliticaAsignacion) {
    Memoria.exigirEnteroPositivo(memoriaTotal, "memoriaTotal");
    this._memoriaTotal = memoriaTotal;
    this._politica = politica;
    this._bloques = [new BloqueMemoria(0, memoriaTotal)];
  }

  obtenerMemoriaTotal(): number {
    return this._memoriaTotal;
  }

  obtenerNombrePolitica(): string {
    return this._politica.obtenerNombre();
  }

  /** Devuelve una copia del mapa; los bloques son inmutables, así que no se puede alterar la memoria desde afuera. */
  obtenerMapa(): readonly BloqueMemoria[] {
    return [...this._bloques];
  }

  private static exigirEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }

  /**
   * Asigna memoria contigua a un proceso según la política configurada.
   * Devuelve false, sin modificar la memoria, si ningún bloque alcanza.
   */
  asignar(pid: number, tamano: number): boolean {
    Memoria.exigirEnteroPositivo(pid, "pid");
    Memoria.exigirEnteroPositivo(tamano, "tamano");
    if (this.tieneMemoriaAsignada(pid)) {
      throw new Error(`El proceso ${pid} ya tiene memoria asignada`);
    }
    const elegido = this._politica.seleccionar(this.obtenerMapa(), tamano);
    if (elegido === null) {
      return false;
    }
    this.ocuparBloque(elegido, pid, tamano);
    return true;
  }

  tieneMemoriaAsignada(pid: number): boolean {
    return this.buscarIndice(pid) !== -1;
  }

  private buscarIndice(pid: number): number {
    return this._bloques.findIndex((bloque) => bloque.obtenerPidProceso() === pid);
  }

  private ocuparBloque(bloque: BloqueMemoria, pid: number, tamano: number): void {
    const indice = this._bloques.indexOf(bloque);
    if (indice === -1) {
      throw new Error("La política devolvió un bloque que no pertenece a la memoria");
    }
    this._bloques.splice(indice, 1, ...this.dividirYOcupar(bloque, pid, tamano));
  }

  /** Ajuste exacto: ocupa el bloque entero. Si sobra espacio, lo divide sin crear bloques de tamaño cero. */
  private dividirYOcupar(bloque: BloqueMemoria, pid: number, tamano: number): BloqueMemoria[] {
    if (bloque.obtenerTamano() === tamano) {
      return [bloque.ocupar(pid)];
    }
    const [primero, resto] = bloque.separar(tamano);
    return [primero.ocupar(pid), resto];
  }

  /** Libera el bloque del proceso. Falla si el proceso no tiene memoria asignada. */
  liberar(pid: number): void {
    const indice = this.buscarIndice(pid);
    if (indice === -1) {
      throw new Error(`El proceso ${pid} no tiene memoria asignada`);
    }
    this._bloques[indice] = this._bloques[indice].liberar();
  }
}
