import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase";
import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/** First-Fit: elige el primer bloque suficiente por dirección. */
export class PrimerAjuste extends PoliticaAsignacionBase {
  override obtenerNombre(): string {
    return "First-Fit";
  }

  protected override comparar(a: BloqueMemoria, b: BloqueMemoria): number {
    return a.obtenerInicio() - b.obtenerInicio();
  }
}