// Tipos para el Reporte de Consumos

export interface ReporteConsumosData {
    fecha: string;           // Formato: YYYY-MM-DD
    ciudad: string;          // CveCiudad (ej: "MTY", "GDL")
    tanque: string;
    idTanque: number;
    totalEntradas: number;   // Litros
    totalSalidas: number;    // Litros
}

export interface ReporteConsumosForm {
    CveCiudad: string;
    IDTanque: string;
    FechaInicial: string;
    FechaFinal: string;
}
