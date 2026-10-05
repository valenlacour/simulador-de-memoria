import { Memoria } from "../../src/modelos/Memoria";
import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";
import type { PoliticaAsignacion } from "../../src/interfaces/PoliticaAsignacion";
import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { verificarInvariantes } from "./invariantesMemoria";

describe("Memoria - creación (RF01)", () => {
  it("inicia con un único bloque libre que abarca toda la memoria", () => {
    const memoria = new Memoria(1024, new PrimerAjuste());
    const mapa = memoria.obtenerMapa();
    expect(memoria.obtenerMemoriaTotal()).toBe(1024);
    expect(mapa).toHaveLength(1);
    expect(mapa[0].obtenerInicio()).toBe(0);
    expect(mapa[0].obtenerTamano()).toBe(1024);
    expect(mapa[0].estaLibre()).toBe(true);
    verificarInvariantes(mapa, 1024);
  });

  it.each([0, -5, 1.5, NaN])("rechaza una memoria total inválida (%d)", (total) => {
    expect(() => new Memoria(total, new PrimerAjuste())).toThrow();
  });

  it("informa el nombre de la política configurada", () => {
    expect(new Memoria(100, new PrimerAjuste()).obtenerNombrePolitica()).toBe("First-Fit");
  });

  it("obtenerMapa devuelve una copia: modificarla no altera la memoria", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    (memoria.obtenerMapa() as BloqueMemoria[]).pop();
    expect(memoria.obtenerMapa()).toHaveLength(1);
  });
});