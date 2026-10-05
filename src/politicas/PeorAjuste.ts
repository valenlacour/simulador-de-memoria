import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase";
import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/** Worst-Fit: elige el bloque suficiente de mayor tamaño. */
export class PeorAjuste extends PoliticaAsignacionBase {
  override obtenerNombre(): string {
    return "Worst-Fit";
  }

  protected override comparar(a: BloqueMemoria, b: BloqueMemoria): number {
    return b.obtenerTamano() - a.obtenerTamano();
  }
}