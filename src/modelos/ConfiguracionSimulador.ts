import { NombrePolitica } from "../politicas/NombrePolitica";

/**
 * Parámetros de la simulación. Se valida todo al construirla, antes de que exista
 * cualquier simulador: una configuración inválida nunca deja estados parciales.
 */
export class ConfiguracionSimulador {
  static readonly MEMORIA_REFERENCIA = 1024;
  static readonly QUANTUM_REFERENCIA = 2;

  private readonly _memoriaTotal: number;
  private readonly _quantum: number;
  private readonly _politica: NombrePolitica;

  constructor(
    memoriaTotal: number,
    quantum: number,
    politica: NombrePolitica = NombrePolitica.FIRST_FIT,
  ) {
    ConfiguracionSimulador.exigirEnteroPositivo(memoriaTotal, "memoriaTotal");
    ConfiguracionSimulador.exigirEnteroPositivo(quantum, "quantum");
    ConfiguracionSimulador.exigirPoliticaValida(politica);
    this._memoriaTotal = memoriaTotal;
    this._quantum = quantum;
    this._politica = politica;
  }

  /** Configuración de referencia del enunciado: 1024 KB, quantum de 2 ticks y First-Fit. */
  static deReferencia(): ConfiguracionSimulador {
    return new ConfiguracionSimulador(
      ConfiguracionSimulador.MEMORIA_REFERENCIA,
      ConfiguracionSimulador.QUANTUM_REFERENCIA,
    );
  }

  obtenerMemoriaTotal(): number {
    return this._memoriaTotal;
  }

  obtenerQuantum(): number {
    return this._quantum;
  }

  obtenerPolitica(): NombrePolitica {
    return this._politica;
  }

  private static exigirEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }

  private static exigirPoliticaValida(politica: NombrePolitica): void {
    if (!Object.values(NombrePolitica).includes(politica)) {
      throw new Error(`Política de asignación desconocida: ${String(politica)}`);
    }
  }
}