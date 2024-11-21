export const getMinTemperature = (data: any[], column: string) =>
    Math.min(...data.map((row) => row[column] || Infinity));
  
  export const getMaxTemperature = (data: any[], column: string) =>
    Math.max(...data.map((row) => row[column] || -Infinity));
  
  export const getNhftValue = (data: any[], column: string, interval: number) => {
    // Implement logic for NHFT calculation
  };
  
  export const calculateCargaResfr = async (
    filteredData: any[],
    additionalFile: File,
    codigo: string,
    selectedInterval: number,
    parseCSVFile: (file: File) => Promise<any[]>
  ) => {
    const cargaData = await parseCSVFile(additionalFile);
    const carga = cargaData.reduce((sum, row) => sum + row[codigo], 0);
    const cargaResfr = carga * selectedInterval; // Replace with real formula
    return { carga, cargaResfr };
  };

  export const roundUpToTwoDecimals = (value: number): number => {
    return Math.ceil(value * 100) / 100;
  };
  
  export const roundToOneDecimal = (value: number): number => {
    return Math.round(value * 10) / 10;
  };
  