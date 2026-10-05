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
}