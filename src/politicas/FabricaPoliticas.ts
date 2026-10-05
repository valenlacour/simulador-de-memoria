import type { PoliticaAsignacion } from "../interfaces/PoliticaAsignacion";
import { MejorAjuste } from "./MejorAjuste";
import { NombrePolitica } from "./NombrePolitica";
import { PeorAjuste } from "./PeorAjuste";
import { PrimerAjuste } from "./PrimerAjuste";

/** Crea la política de asignación elegida al configurar la simulación (tabla de despacho, sin condicionales por tipo). */
export class FabricaPoliticas {
  private static readonly CONSTRUCTORES: Record<NombrePolitica, () => PoliticaAsignacion> = {
    [NombrePolitica.FIRST_FIT]: () => new PrimerAjuste(),
    [NombrePolitica.BEST_FIT]: () => new MejorAjuste(),
    [NombrePolitica.WORST_FIT]: () => new PeorAjuste(),
  };

  static crear(nombre: NombrePolitica): PoliticaAsignacion {
    const constructor = FabricaPoliticas.CONSTRUCTORES[nombre];
    if (constructor === undefined) {
      throw new Error(`Política de asignación desconocida: ${String(nombre)}`);
    }
    return constructor();
  }
}