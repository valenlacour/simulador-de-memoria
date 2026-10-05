import { PeorAjuste } from "../../src/politicas/PeorAjuste";
import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";
import { crearMapaDePrueba } from "./mapaDePrueba";

describe("PeorAjuste / Worst-Fit (RF04)", () => {
  const politica = new PeorAjuste();

  it("se identifica como Worst-Fit", () => {
    expect(politica.obtenerNombre()).toBe("Worst-Fit");
  });

  it("elige el bloque libre de mayor tamaño", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 80)?.obtenerInicio()).toBe(150);
  });

  it("acepta un ajuste exacto con el bloque mayor", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 300)?.obtenerInicio()).toBe(150);
  });

  it("devuelve null si ningún bloque alcanza", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 400)).toBeNull();
  });

  it("ante un empate de tamaño elige la menor dirección", () => {
    const bloques = [new BloqueMemoria(700, 300), new BloqueMemoria(0, 300)];
    expect(politica.seleccionar(bloques, 10)?.obtenerInicio()).toBe(0);
  });
});