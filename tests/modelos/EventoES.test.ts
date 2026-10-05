import { EventoES } from "../../src/modelos/EventoES";

describe("EventoES - validación (RF08)", () => {
  it("guarda el punto de disparo y la duración", () => {
    const evento = new EventoES(2, 3);
    expect(evento.obtenerCpuConsumida()).toBe(2);
    expect(evento.obtenerDuracion()).toBe(3);
  });

  it.each([
    [0, 1],
    [-1, 1],
    [1.5, 1],
    [NaN, 1],
    [1, 0],
    [1, -3],
    [1, 2.5],
    [1, NaN],
  ])("rechaza un evento inválido (%d, %d)", (cpuConsumida, duracion) => {
    expect(() => new EventoES(cpuConsumida, duracion)).toThrow();
  });
});