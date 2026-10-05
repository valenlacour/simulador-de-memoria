import type { BloqueMemoria } from "../modelos/BloqueMemoria";

/** Contrato del gestor de memoria principal que usa el simulador. */
export interface GestorMemoria {
  obtenerMemoriaTotal(): number;
  obtenerNombrePolitica(): string;
  obtenerMapa(): readonly BloqueMemoria[];
  tieneMemoriaAsignada(pid: number): boolean;
  asignar(pid: number, tamano: number): boolean;
  liberar(pid: number): void;
  obtenerMemoriaOcupada(): number;
  obtenerMemoriaLibreTotal(): number;
  obtenerMayorBloqueLibre(): number;
  obtenerOcupacion(): number;
  obtenerFragmentacionExterna(): number;
}