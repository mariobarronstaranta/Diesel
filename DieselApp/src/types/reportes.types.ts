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
  IDUnidad?: string;
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
  IDUnidad: string;
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

export interface ReporteRendimientosV2Data {
  Unidad: string;
  IDUnidad: number;
  "Carga Total": number;
  "Kms Recorridos": number;
  "Hrs Recorridos": number;
  "Kms/Lts": number;
  "Hrs/Lts": number;
  "Tanque Principal": string;
  "Tanques Utilizados": string;
  "Cantidad Tanques": number;
}

export interface RendimientoDetalleV2Item {
  id_tanque_movimiento: number;
  tanque: string;
  fecha: string;
  hora: string;
  litros: number;
  cuenta_litros: number;
  odometro_ant: number | null;
  horometro_ant: number | null;
  horometro: number;
  odometro: number;
}

// Tipos para el Reporte de Productividad y Rentabilidad

export interface ReporteProductividadData {
  EstadoRegistro: string;
  Tanque: string;
  Unidad: string;
  IDUnidad: number;
  Viajes: number;
  MetrosCubicos: number;
  "Kms Totales": number;
  "Hrs Totales": number;
  "Litros Consumidos": number;
  "Lts/M3": number;
  "Km/Lts": number;
  "M3/Viaje": number;
}

export interface ReporteProductividadForm {
  CveCiudad: string;
  IDTanque: string;
  FechaInicial: string;
  FechaFinal: string;
}

// Tipos para el modal de detalle del Reporte de Productividad

export interface ProductividadMovDiesel {
  FechaCarga: string;
  HoraCarga?: string;
  LitrosCarga: number;
  Horimetro: number | null;
  Odometro: number | null;
}

export interface ProductividadMovSP {
  FechaInicio: string;
  HoraInicio?: string;
  NombreUnidad: string;
  CargaViaje: number;
  Remision: string;
  NombreProducto: string;
  NombreCliente: string;
}
