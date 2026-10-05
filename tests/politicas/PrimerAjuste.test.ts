import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { crearMapaDePrueba } from "./mapaDePrueba";

describe("PrimerAjuste / First-Fit (RF04)", () => {
  const politica = new PrimerAjuste();

  it("se identifica como First-Fit", () => {
    expect(politica.obtenerNombre()).toBe("First-Fit");
  });

  it("elige el primer bloque suficiente por dirección, aunque haya uno más justo", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 80)?.obtenerInicio()).toBe(0);
    expect(politica.seleccionar(crearMapaDePrueba(), 90)?.obtenerInicio()).toBe(0);
  });

  it("salta los bloques que no alcanzan", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 150)?.obtenerInicio()).toBe(150);
  });

  it("acepta un ajuste exacto", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 100)?.obtenerInicio()).toBe(0);
  });

  it("devuelve null si ningún bloque alcanza", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 400)).toBeNull();
  });
});