import type { PoliticaAsignacion } from "../interfaces/PoliticaAsignacion";
import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/**
 * Comparte el algoritmo común de las políticas: filtrar los bloques libres que
 * alcanzan, ordenarlos según el criterio de cada política y desempatar por la
 * menor dirección. Cada política concreta solo define el criterio en `comparar`.
 */
export abstract class PoliticaAsignacionBase implements PoliticaAsignacion {
  abstract obtenerNombre(): string;

  /** Devuelve un número negativo si `a` es preferible a `b` según la política. */
  protected abstract comparar(a: BloqueMemoria, b: BloqueMemoria): number;

  seleccionar(
    bloques: readonly BloqueMemoria[],
    tamanoRequerido: number,
  ): BloqueMemoria | null {
    const candidatos = bloques
      .filter((bloque) => bloque.puedeContener(tamanoRequerido))
      .sort((a, b) => this.compararConDesempate(a, b));
    return candidatos.length === 0 ? null : candidatos[0];
  }

  private compararConDesempate(a: BloqueMemoria, b: BloqueMemoria): number {
    const resultado = this.comparar(a, b);
    return resultado !== 0 ? resultado : a.obtenerInicio() - b.obtenerInicio();
  }
}