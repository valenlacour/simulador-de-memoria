import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/**
 * Contrato de una política de asignación contigua de memoria.
 * Dado el mapa de bloques, elige cuál usar para un pedido (o ninguno).
 */
export interface PoliticaAsignacion {
  obtenerNombre(): string;
  seleccionar(
    bloques: readonly BloqueMemoria[],
    tamanoRequerido: number,
  ): BloqueMemoria | null;
}