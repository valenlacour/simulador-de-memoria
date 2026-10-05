import { PoliticaAsignacionBase } from "../../src/politicas/PoliticaAsignacionBase";
import { BloqueMemoria } from "../../src/modelos/BloqueMemoria";

// Doble de prueba: política mínima que prefiere el bloque de menor tamaño.
class PoliticaDePrueba extends PoliticaAsignacionBase {
  override obtenerNombre(): string {
    return "Prueba";
  }

  protected override comparar(a: BloqueMemoria, b: BloqueMemoria): number {
    return a.obtenerTamano() - b.obtenerTamano();
  }
}

describe("PoliticaAsignacionBase (RF04)", () => {
  const politica = new PoliticaDePrueba();

  it("ignora los bloques ocupados", () => {
    const libre = new BloqueMemoria(500, 100);
    const bloques = [new BloqueMemoria(0, 500, 1), libre];
    expect(politica.seleccionar(bloques, 50)).toBe(libre);
  });

  it("ignora los bloques libres que no alcanzan", () => {
    const grande = new BloqueMemoria(40, 200);
    const bloques = [new BloqueMemoria(0, 40), grande];
    expect(politica.seleccionar(bloques, 100)).toBe(grande);
  });

  it("devuelve null si ningún bloque alcanza", () => {
    const bloques = [new BloqueMemoria(0, 40), new BloqueMemoria(40, 200, 1)];
    expect(politica.seleccionar(bloques, 100)).toBeNull();
  });

  it("devuelve null con una lista vacía", () => {
    expect(politica.seleccionar([], 10)).toBeNull();
  });

  it("ante un empate elige la menor dirección, sin depender del orden de entrada", () => {
    const alto = new BloqueMemoria(300, 100);
    const bajo = new BloqueMemoria(0, 100);
    expect(politica.seleccionar([alto, bajo], 50)).toBe(bajo);
  });

  it("no modifica el arreglo recibido", () => {
    const b1 = new BloqueMemoria(300, 100);
    const b2 = new BloqueMemoria(0, 100);
    const bloques = [b1, b2];
    politica.seleccionar(bloques, 50);
    expect(bloques[0]).toBe(b1);
    expect(bloques[1]).toBe(b2);
  });
});