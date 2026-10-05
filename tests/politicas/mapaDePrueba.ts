import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";

/**
 * Mapa de 590 KB que usan los tests de las políticas:
 *   0-99 libre (100) | 100-149 ocupado | 150-449 libre (300)
 *   | 450-499 ocupado | 500-589 libre (90)
 */
export function crearMapaDePrueba(): BloqueMemoria[] {
  return [
    new BloqueMemoria(0, 100),
    new BloqueMemoria(100, 50, 1),
    new BloqueMemoria(150, 300),
    new BloqueMemoria(450, 50, 2),
    new BloqueMemoria(500, 90),
  ];
}