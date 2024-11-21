import { parseCsvFile, filterData } from './parseFiles';
import { cargaTerm, calculateCargaResfr } from '../utils/cargaUtils';

export const processCargaTermica = async (
  tipoAmbiente: string,
  codigo: string,
  filteredData: any[],
  includeCargaTermica: boolean,
  additionalFile: File | null
) => {
  let carga = 0;
  let cargaResfrValue = 0;

  if (includeCargaTermica && additionalFile) {
    try {
      const cargaData = await parseCsvFile(additionalFile);
      const cargaFilteredData = filterData(cargaData, tipoAmbiente);
      const cargaTermicaResult = await cargaTerm({
        cargaFilteredData,
        filteredData,
        codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
        codigoSolo: codigo,
        thresholdVar: selectedInterval,
      });

      cargaResfrValue = calculateCargaResfr(
        cargaFilteredData,
        codigo,
        selectedInterval
      );
      carga = cargaTermicaResult;
    } catch (error) {
      console.error('Erro ao processar arquivo de Carga Térmica:', error);
    }
  }

  return { carga, cargaResfrValue };
};
