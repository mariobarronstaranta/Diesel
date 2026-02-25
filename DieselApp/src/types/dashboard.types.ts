// Tipos para el Dashboard

export interface DashboardFilters {
  CveCiudad: string;
  IDTanque: string;
  FechaInicial: string;
  FechaFinal: string;
}

export interface KpiData {
  totalEntradas: number;
  totalSalidas: number;
  balance: number;
  promedioRendimiento: number;
}

export interface ConsumoDiario {
  fecha: string;
  entradas: number;
  salidas: number;
}

export interface ConsumoTanque {
  tanque: string;
  entradas: number;
  salidas: number;
}

export interface RendimientoUnidad {
  unidad: string;
  kmsLts: number;
}
