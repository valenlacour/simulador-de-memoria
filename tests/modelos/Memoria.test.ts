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
describe("Memoria - asignar (RF04)", () => {
  const crear = (total = 100) => new Memoria(total, new PrimerAjuste());

  it("parte el bloque libre cuando sobra espacio", () => {
    const memoria = crear(100);
    expect(memoria.asignar(1, 30)).toBe(true);
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(2);
    expect(mapa[0].obtenerPidProceso()).toBe(1);
    expect(mapa[0].obtenerTamano()).toBe(30);
    expect(mapa[1].estaLibre()).toBe(true);
    expect(mapa[1].obtenerInicio()).toBe(30);
    expect(mapa[1].obtenerTamano()).toBe(70);
    verificarInvariantes(mapa, 100);
  });

  it("un ajuste exacto ocupa todo el bloque sin generar uno de tamaño cero", () => {
    const memoria = crear(100);
    expect(memoria.asignar(1, 100)).toBe(true);
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].obtenerPidProceso()).toBe(1);
    verificarInvariantes(mapa, 100);
  });

  it("asigna procesos consecutivos en direcciones contiguas", () => {
    const memoria = crear(100);
    memoria.asignar(1, 30);
    memoria.asignar(2, 20);
    const mapa = memoria.obtenerMapa();
    expect(mapa.map((b) => b.obtenerInicio())).toEqual([0, 30, 50]);
    expect(mapa.map((b) => b.obtenerPidProceso())).toEqual([1, 2, null]);
    verificarInvariantes(mapa, 100);
  });

  it("informa qué procesos tienen memoria asignada", () => {
    const memoria = crear(100);
    memoria.asignar(1, 30);
    expect(memoria.tieneMemoriaAsignada(1)).toBe(true);
    expect(memoria.tieneMemoriaAsignada(2)).toBe(false);
  });
});

describe("Memoria - asignar: fallos y validaciones (RF04)", () => {
  it("falla sin modificar el mapa cuando ningún bloque alcanza", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 60);
    const antes = memoria.obtenerMapa();
    expect(memoria.asignar(2, 50)).toBe(false);
    expect(memoria.obtenerMapa()).toEqual(antes);
    expect(memoria.tieneMemoriaAsignada(2)).toBe(false);
  });

  it("un pedido mayor a la memoria total falla sin modificar nada", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    expect(memoria.asignar(1, 101)).toBe(false);
    expect(memoria.obtenerMapa()).toHaveLength(1);
    expect(memoria.obtenerMapa()[0].estaLibre()).toBe(true);
  });

  it.each([
    [0, 10],
    [-1, 10],
    [1, 0],
    [1, -5],
    [1, 2.5],
  ])("rechaza datos inválidos (%d, %d)", (pid, tamano) => {
    expect(() => new Memoria(100, new PrimerAjuste()).asignar(pid, tamano)).toThrow();
  });

  it("rechaza asignar dos veces al mismo proceso", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 10);
    expect(() => memoria.asignar(1, 10)).toThrow();
    expect(memoria.obtenerMapa()).toHaveLength(2);
  });

  it("rechaza una política que devuelve un bloque ajeno a la memoria", () => {
    const politicaDefectuosa: PoliticaAsignacion = {
      obtenerNombre: () => "Defectuosa",
      seleccionar: () => new BloqueMemoria(0, 100),
    };
    const memoria = new Memoria(100, politicaDefectuosa);
    expect(() => memoria.asignar(1, 10)).toThrow();
    expect(memoria.obtenerMapa()).toHaveLength(1);
  });
});
