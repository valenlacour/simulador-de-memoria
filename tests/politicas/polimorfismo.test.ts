import type { PoliticaAsignacion } from "../../src/interfaces/PoliticaAsignacion";
import { PrimerAjuste } from "../../src/politicas/PrimerAjuste";
import { MejorAjuste } from "../../src/politicas/MejorAjuste";
import { PeorAjuste } from "../../src/politicas/PeorAjuste";
import { crearMapaDePrueba } from "./mapaDePrueba";

// Las tres políticas se usan únicamente a través del contrato común.
const casos: { politica: PoliticaAsignacion; nombre: string; inicioEsperado: number }[] = [
  { politica: new PrimerAjuste(), nombre: "First-Fit", inicioEsperado: 0 },
  { politica: new MejorAjuste(), nombre: "Best-Fit", inicioEsperado: 500 },
  { politica: new PeorAjuste(), nombre: "Worst-Fit", inicioEsperado: 150 },
];

describe("Políticas de asignación - polimorfismo (RF04)", () => {
  it.each(casos)(
    "$nombre elige el bloque que empieza en $inicioEsperado para un pedido de 80",
    ({ politica, nombre, inicioEsperado }) => {
      expect(politica.obtenerNombre()).toBe(nombre);
      expect(politica.seleccionar(crearMapaDePrueba(), 80)?.obtenerInicio()).toBe(inicioEsperado);
    },
  );

  it.each(casos)("$nombre devuelve null si el pedido no entra", ({ politica }) => {
    expect(politica.seleccionar(crearMapaDePrueba(), 400)).toBeNull();
  });

  it.each(casos)("$nombre coincide con las demás cuando hay un único candidato", ({ politica }) => {
    expect(politica.seleccionar(crearMapaDePrueba(), 150)?.obtenerInicio()).toBe(150);
  });
});