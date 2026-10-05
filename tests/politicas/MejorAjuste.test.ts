import { MejorAjuste } from "../../src/politicas/MejorAjuste";
import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";
import { crearMapaDePrueba } from "./mapaDePrueba";

describe("MejorAjuste / Best-Fit (RF04)", () => {
  const politica = new MejorAjuste();

  it("se identifica como Best-Fit", () => {
    expect(politica.obtenerNombre()).toBe("Best-Fit");
  });

  it("elige el bloque suficiente de menor tamaño", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 80)?.obtenerInicio()).toBe(500);
  });

  it("acepta un ajuste exacto", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 90)?.obtenerInicio()).toBe(500);
  });

  it("si solo uno alcanza, elige ese", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 101)?.obtenerInicio()).toBe(150);
  });

  it("devuelve null si ningún bloque alcanza", () => {
    expect(politica.seleccionar(crearMapaDePrueba(), 400)).toBeNull();
  });

  it("ante un empate de tamaño elige la menor dirección", () => {
    const bloques = [new BloqueMemoria(300, 100), new BloqueMemoria(0, 100)];
    expect(politica.seleccionar(bloques, 100)?.obtenerInicio()).toBe(0);
  });
});