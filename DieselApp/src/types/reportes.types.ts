// Tipos para el Reporte de Consumos

export interface ReporteConsumosData {
  fecha: string; // Formato: YYYY-MM-DD
  ciudad: string; // CveCiudad (ej: "MTY", "GDL")
  tanque: string;
  idTanque: number;
  totalEntradas: number; // Litros
  totalSalidas: number; // Litros
}

export interface ReporteConsumosForm {
  CveCiudad: string;
  IDTanque: string;
  FechaInicial: string;
  FechaFinal: string;
}

// Tipos para el Reporte de Rendimientos

export interface ReporteRendimientosData {
  Tanque: string;
  Unidad: string;
  IDUnidad: number;
  "Carga Total": number;
  "Kms Recorridos": number;
  "Hrs Recorridos": number;
  "Kms/Lts": number;
  "Hrs/Lts": number;
}

export interface ReporteRendimientosForm {
  CveCiudad: string;
  IDTanque: string;
  FechaInicial: string;
  FechaFinal: string;
}

export interface RendimientoDetalleItem {
  id_tanque_movimiento: number;
  fecha: string;
  hora: string;
  litros: number;
  cuenta_litros: number;
  horometro: number;
  odometro: number;
}
