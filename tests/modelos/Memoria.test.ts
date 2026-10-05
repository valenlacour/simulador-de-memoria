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

describe("Memoria - liberar (RF05)", () => {
  it("deja el bloque libre y conserva el tamaño total", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 30);
    memoria.asignar(2, 30);
    memoria.liberar(1);
    const mapa = memoria.obtenerMapa();
    expect(mapa[0].estaLibre()).toBe(true);
    expect(mapa[0].obtenerTamano()).toBe(30);
    expect(memoria.tieneMemoriaAsignada(1)).toBe(false);
    verificarInvariantes(mapa, 100);
  });

  it("rechaza liberar un proceso que no tiene memoria", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    expect(() => memoria.liberar(9)).toThrow();
  });

  it("la memoria liberada permite admitir a un proceso que no entraba", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 60);
    expect(memoria.asignar(2, 50)).toBe(false);
    memoria.liberar(1);
    expect(memoria.asignar(2, 50)).toBe(true);
    expect(memoria.tieneMemoriaAsignada(2)).toBe(true);
  });

  it("falla aunque la suma de memoria libre alcance, si no hay un hueco contiguo", () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 30);
    memoria.asignar(2, 30);
    memoria.asignar(3, 30);
    memoria.liberar(1);
    const antes = memoria.obtenerMapa();
    expect(memoria.asignar(4, 35)).toBe(false);
    expect(memoria.obtenerMapa()).toEqual(antes);
  });
});

describe("Memoria - coalescencia (RF05)", () => {
  // Memoria de 100 KB con p1, p2 y p3 de 30 KB y 10 KB libres al final.
  const crearConTresProcesos = () => {
    const memoria = new Memoria(100, new PrimerAjuste());
    memoria.asignar(1, 30);
    memoria.asignar(2, 30);
    memoria.asignar(3, 30);
    return memoria;
  };

  it("fusiona con el vecino derecho libre", () => {
    const memoria = crearConTresProcesos();
    memoria.liberar(3);
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(3);
    expect(mapa[2].estaLibre()).toBe(true);
    expect(mapa[2].obtenerInicio()).toBe(60);
    expect(mapa[2].obtenerTamano()).toBe(40);
    verificarInvariantes(mapa, 100);
  });

  it("fusiona con el vecino izquierdo libre", () => {
    const memoria = crearConTresProcesos();
    memoria.liberar(1);
    memoria.liberar(2);
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(3);
    expect(mapa[0].obtenerInicio()).toBe(0);
    expect(mapa[0].obtenerTamano()).toBe(60);
    expect(mapa[1].obtenerPidProceso()).toBe(3);
    verificarInvariantes(mapa, 100);
  });

  it("fusiona con ambos vecinos a la vez", () => {
    const memoria = crearConTresProcesos();
    memoria.liberar(1);
    memoria.liberar(3);
    memoria.liberar(2);
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].estaLibre()).toBe(true);
    expect(mapa[0].obtenerTamano()).toBe(100);
    verificarInvariantes(mapa, 100);
  });

  it("no mueve los bloques ocupados: la coalescencia no compacta", () => {
    const memoria = crearConTresProcesos();
    memoria.liberar(1);
    memoria.liberar(2);
    const bloqueDeP3 = memoria.obtenerMapa().find((b) => b.obtenerPidProceso() === 3);
    expect(bloqueDeP3?.obtenerInicio()).toBe(60);
    expect(bloqueDeP3?.obtenerTamano()).toBe(30);
  });

  it.each([
    [1, 2, 3],
    [1, 3, 2],
    [2, 1, 3],
    [2, 3, 1],
    [3, 1, 2],
    [3, 2, 1],
  ])("al liberar todos (orden %d, %d, %d) queda un único bloque libre del tamaño total", (a, b, c) => {
    const memoria = crearConTresProcesos();
    [a, b, c].forEach((pid) => {
      memoria.liberar(pid);
      verificarInvariantes(memoria.obtenerMapa(), 100);
    });
    const mapa = memoria.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0].estaLibre()).toBe(true);
    expect(mapa[0].obtenerTamano()).toBe(100);
  });
});

describe("Memoria - métricas (RF09)", () => {
  it("memoria vacía (tick 0): todo libre y sin fragmentación", () => {
    const memoria = new Memoria(1024, new PrimerAjuste());
    expect(memoria.obtenerMemoriaOcupada()).toBe(0);
    expect(memoria.obtenerMemoriaLibreTotal()).toBe(1024);
    expect(memoria.obtenerMayorBloqueLibre()).toBe(1024);
    expect(memoria.obtenerOcupacion()).toBe(0);
    expect(memoria.obtenerFragmentacionExterna()).toBe(0);
  });

  it("memoria llena: sin bloques libres, mayor bloque 0 y fragmentación 0", () => {
    const memoria = new Memoria(1000, new PrimerAjuste());
    memoria.asignar(1, 1000);
    expect(memoria.obtenerMemoriaLibreTotal()).toBe(0);
    expect(memoria.obtenerMayorBloqueLibre()).toBe(0);
    expect(memoria.obtenerOcupacion()).toBe(100);
    expect(memoria.obtenerFragmentacionExterna()).toBe(0);
  });

  it("ocupación parcial: 250 de 1000 KB es 25%", () => {
    const memoria = new Memoria(1000, new PrimerAjuste());
    memoria.asignar(1, 250);
    expect(memoria.obtenerMemoriaOcupada()).toBe(250);
    expect(memoria.obtenerOcupacion()).toBe(25);
    expect(memoria.obtenerFragmentacionExterna()).toBe(0);
  });

  it("huecos no contiguos de 100 y 300 KB: libre 400, mayor hueco 300 y fragmentación 25%", () => {
    const memoria = new Memoria(1000, new PrimerAjuste());
    memoria.asignar(1, 100);
    memoria.asignar(2, 100);
    memoria.asignar(3, 300);
    memoria.asignar(4, 100);
    memoria.asignar(5, 400);
    memoria.liberar(1);
    memoria.liberar(3);
    expect(memoria.obtenerMemoriaLibreTotal()).toBe(400);
    expect(memoria.obtenerMayorBloqueLibre()).toBe(300);
    expect(memoria.obtenerFragmentacionExterna()).toBe(25);
    expect(memoria.obtenerOcupacion()).toBe(60);
  });
});
