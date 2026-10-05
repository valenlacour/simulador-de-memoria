import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase";
import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/** Best-Fit: elige el bloque suficiente de menor tamaño. */
export class MejorAjuste extends PoliticaAsignacionBase {
  override obtenerNombre(): string {
    return "Best-Fit";
  }

  protected override comparar(a: BloqueMemoria, b: BloqueMemoria): number {
    return a.obtenerTamano() - b.obtenerTamano();
  }
}