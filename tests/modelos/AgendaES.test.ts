import { AgendaES } from "../../src/modelos/AgendaES";
import { EventoES } from "../../src/modelos/EventoES";
import type { ProveedorEventosES } from "../../src/interfaces/ProveedorEventosES";

describe("AgendaES (RF08)", () => {
  it("sin eventos devuelve null", () => {
    expect(new AgendaES().buscarDuracionBloqueo(1, 1)).toBeNull();
  });

  it("devuelve la duración solo en el punto exacto y para el proceso indicado", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 5, new EventoES(2, 3));
    expect(agenda.buscarDuracionBloqueo(1, 2)).toBe(3);
    expect(agenda.buscarDuracionBloqueo(1, 1)).toBeNull();
    expect(agenda.buscarDuracionBloqueo(1, 3)).toBeNull();
    expect(agenda.buscarDuracionBloqueo(2, 2)).toBeNull();
  });

  it("admite varios eventos de un mismo proceso en puntos distintos", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 6, new EventoES(1, 2));
    agenda.definirEvento(1, 6, new EventoES(4, 5));
    expect(agenda.buscarDuracionBloqueo(1, 1)).toBe(2);
    expect(agenda.buscarDuracionBloqueo(1, 4)).toBe(5);
    expect(agenda.obtenerEventos(1)).toHaveLength(2);
  });

  it("admite el mismo punto en procesos distintos", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 5, new EventoES(2, 3));
    agenda.definirEvento(2, 5, new EventoES(2, 7));
    expect(agenda.buscarDuracionBloqueo(1, 2)).toBe(3);
    expect(agenda.buscarDuracionBloqueo(2, 2)).toBe(7);
  });

  it.each([3, 4])("rechaza un evento que nunca se dispararía (punto %d, CPU total 3)", (punto) => {
    const agenda = new AgendaES();
    expect(() => agenda.definirEvento(1, 3, new EventoES(punto, 1))).toThrow();
    expect(agenda.obtenerEventos(1)).toHaveLength(0);
  });

  it("acepta un evento en el último tick previo al final del proceso", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 3, new EventoES(2, 1));
    expect(agenda.buscarDuracionBloqueo(1, 2)).toBe(1);
  });

  it("rechaza dos eventos en el mismo punto del mismo proceso y conserva el original", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 5, new EventoES(2, 3));
    expect(() => agenda.definirEvento(1, 5, new EventoES(2, 9))).toThrow();
    expect(agenda.buscarDuracionBloqueo(1, 2)).toBe(3);
  });

  it("obtenerEventos devuelve una copia: modificarla no altera la agenda", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 5, new EventoES(2, 3));
    (agenda.obtenerEventos(1) as EventoES[]).pop();
    expect(agenda.obtenerEventos(1)).toHaveLength(1);
  });

  it("puede usarse donde se espera un ProveedorEventosES", () => {
    const agenda = new AgendaES();
    agenda.definirEvento(1, 5, new EventoES(2, 3));
    const proveedor: ProveedorEventosES = agenda;
    expect(proveedor.buscarDuracionBloqueo(1, 2)).toBe(3);
  });
});