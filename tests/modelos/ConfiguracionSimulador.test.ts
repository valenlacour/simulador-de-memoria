import { ConfiguracionSimulador } from "../../src/modelos/ConfiguracionSimulador";
import { NombrePolitica } from "../../src/politicas/NombrePolitica";

describe("ConfiguracionSimulador (RF01)", () => {
  it("la configuración de referencia usa 1024 KB, quantum 2 y First-Fit", () => {
    const configuracion = ConfiguracionSimulador.deReferencia();
    expect(configuracion.obtenerMemoriaTotal()).toBe(1024);
    expect(configuracion.obtenerQuantum()).toBe(2);
    expect(configuracion.obtenerPolitica()).toBe(NombrePolitica.FIRST_FIT);
  });

  it("guarda memoria, quantum y política configurados", () => {
    const configuracion = new ConfiguracionSimulador(512, 4, NombrePolitica.WORST_FIT);
    expect(configuracion.obtenerMemoriaTotal()).toBe(512);
    expect(configuracion.obtenerQuantum()).toBe(4);
    expect(configuracion.obtenerPolitica()).toBe(NombrePolitica.WORST_FIT);
  });

  it("si no se indica la política usa First-Fit", () => {
    expect(new ConfiguracionSimulador(100, 2).obtenerPolitica()).toBe(NombrePolitica.FIRST_FIT);
  });

  it.each([0, -1, 1.5, NaN])("rechaza una memoria total inválida (%d)", (memoria) => {
    expect(() => new ConfiguracionSimulador(memoria, 2)).toThrow();
  });

  it.each([0, -1, 1.5, NaN])("rechaza un quantum inválido (%d)", (quantum) => {
    expect(() => new ConfiguracionSimulador(100, quantum)).toThrow();
  });

  it("rechaza una política desconocida", () => {
    expect(() => new ConfiguracionSimulador(100, 2, "NEXT_FIT" as NombrePolitica)).toThrow();
  });
});