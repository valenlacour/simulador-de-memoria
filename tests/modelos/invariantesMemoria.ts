import type { BloqueMemoria } from "../../src/modelos/BloqueMemoria";

/**
 * Verifica las invariantes del mapa: continuidad desde 0, tamaño total,
 * sin bloques de tamaño cero, sin solapamientos y sin libres adyacentes.
 */
export function verificarInvariantes(mapa: readonly BloqueMemoria[], memoriaTotal: number): void {
  expect(mapa.length).toBeGreaterThan(0);
  expect(mapa[0].obtenerInicio()).toBe(0);
  expect(mapa[mapa.length - 1].obtenerFin()).toBe(memoriaTotal);
  mapa.forEach((bloque, i) => {
    expect(bloque.obtenerTamano()).toBeGreaterThan(0);
    if (i > 0) {
      expect(bloque.obtenerInicio()).toBe(mapa[i - 1].obtenerFin());
      expect(bloque.estaLibre() && mapa[i - 1].estaLibre()).toBe(false);
    }
  });
}