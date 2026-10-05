import type { GestorMemoria } from "../../src/interfaces/GestorMemoria";
import type { PoliticaAsignacion } from "../../src/interfaces/PoliticaAsignacion";
import { Memoria } from "../../src/modelos/Memoria";
import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { MejorAjuste } from "../../src/politicas/MejorAjuste";
import { PeorAjuste } from "../../src/politicas/PeorAjuste";
import { verificarInvariantes } from "./invariantesMemoria";

const politicas: [string, PoliticaAsignacion, number][] = [
  ["First-Fit", new PrimerAjuste(), 0],
  ["Best-Fit", new MejorAjuste(), 500],
  ["Worst-Fit", new PeorAjuste(), 150],
];

// Con un único hueco las tres políticas eligen igual, así el mapa de partida es el mismo.
// Quedan huecos libres de 100 KB (en 0), 300 KB (en 150) y 90 KB (en 500).
function crearMemoriaConHuecos(politica: PoliticaAsignacion): GestorMemoria {
  const memoria = new Memoria(590, politica);
  [[1, 100], [2, 50], [3, 300], [4, 50], [5, 90]].forEach(([pid, tamano]) => {
    memoria.asignar(pid, tamano);
  });
  [1, 3, 5].forEach((pid) => memoria.liberar(pid));
  return memoria;
}

describe("Memoria con las tres políticas (RF04)", () => {
  it.each(politicas)(
    "%s ubica un pedido de 80 KB en la dirección esperada",
    (nombre, politica, inicioEsperado) => {
      const memoria = crearMemoriaConHuecos(politica);
      expect(memoria.obtenerNombrePolitica()).toBe(nombre);
      expect(memoria.asignar(6, 80)).toBe(true);
      const bloque = memoria.obtenerMapa().find((b) => b.obtenerPidProceso() === 6);
      expect(bloque?.obtenerInicio()).toBe(inicioEsperado);
      verificarInvariantes(memoria.obtenerMapa(), 590);
    },
  );

  it.each(politicas)("%s deja el mismo mapa de partida con huecos de 100, 300 y 90", (_nombre, politica) => {
    const memoria = crearMemoriaConHuecos(politica);
    expect(memoria.obtenerMemoriaLibreTotal()).toBe(490);
    expect(memoria.obtenerMayorBloqueLibre()).toBe(300);
    verificarInvariantes(memoria.obtenerMapa(), 590);
  });

  it.each(politicas)("%s: al liberar todo queda un único bloque libre del tamaño total", (_nombre, politica) => {
    const memoria = crearMemoriaConHuecos(politica);
    memoria.asignar(6, 80);
    [2, 4, 6].forEach((pid) => memoria.liberar(pid));
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].obtenerTamano()).toBe(590);
    expect(memoria.obtenerFragmentacionExterna()).toBe(0);
  });
});