import { filterData } from '../utils/dataUtils';
import { cargaTerm, calculateCargaResfr } from '../utils/cargaUtils';
import { parseFile } from '../utils/parseFiles';

export const processCargaTermica = async (
  tipoAmbiente: string,
  codigo: string,
  filteredData: any,
  includeCargaTermica: any,
  additionalFile: File,
  numericSelectedInterval: number
) => {
  // Verifica se a carga térmica deve ser incluída e se o arquivo adicional está presente
  if (!includeCargaTermica || !additionalFile) {
    return { carga: 0, cargaResfrValue: 0 };
  }

  try {
    // Parse do arquivo adicional
    const cargaData = await parseFile(additionalFile);
    
    // Filtra os dados uma única vez
    const cargaFilteredData = filterData(cargaData, tipoAmbiente);

    // Execução paralela das funções que podem ser feitas simultaneamente
    const [cargaTermicaResult, cargaResfrValue] = await Promise.all([
      cargaTerm({
        cargaFilteredData,
        filteredData,
        codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
        codigoSolo: codigo,
        thresholdVar: numericSelectedInterval,
      }),
      calculateCargaResfr(cargaFilteredData, codigo, numericSelectedInterval),
    ]);

    return { carga: cargaTermicaResult, cargaResfrValue };
  } catch (error) {
    console.error('Erro ao processar arquivo de Carga Térmica:', error);
    return { carga: 0, cargaResfrValue: 0 };
  }
};
