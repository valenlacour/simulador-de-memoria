import type { PoliticaAsignacion } from "../../src/interfaces/PoliticaAsignacion";
import { FabricaPoliticas } from "../../src/politicas/FabricaPoliticas";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";
import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { MejorAjuste } from "../../src/politicas/MejorAjuste";
import { PeorAjuste } from "../../src/politicas/PeorAjuste";

const casos: [NombrePolitica, new () => PoliticaAsignacion, string][] = [
  [NombrePolitica.FIRST_FIT, PrimerAjuste, "First-Fit"],
  [NombrePolitica.BEST_FIT, MejorAjuste, "Best-Fit"],
  [NombrePolitica.WORST_FIT, PeorAjuste, "Worst-Fit"],
];

describe("FabricaPoliticas (RF04)", () => {
  it.each(casos)("crea la política %s", (nombre, clase, nombreLegible) => {
    const politica = FabricaPoliticas.crear(nombre);
    expect(politica).toBeInstanceOf(clase);
    expect(politica.obtenerNombre()).toBe(nombreLegible);
  });

  it("cada llamada devuelve una instancia nueva", () => {
    const a = FabricaPoliticas.crear(NombrePolitica.FIRST_FIT);
    const b = FabricaPoliticas.crear(NombrePolitica.FIRST_FIT);
    expect(a).not.toBe(b);
  });

  it("rechaza un nombre de política desconocido", () => {
    expect(() => FabricaPoliticas.crear("NEXT_FIT" as NombrePolitica)).toThrow();
  });
});