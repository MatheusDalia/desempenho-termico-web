import { parseFile, parseModelExcel } from '../utils/fileParser';
import {
  filterData,
  getMaxTemperature,
  getMinTemperature,
  getNhftValue,
  roundUpToTwoDecimals,
} from '../utils/dataUtils';
import { cargaTerm, calculateCargaResfr } from '../utils/cargaUtils';
import {
  createSummaryData,
  createNivelMinimoData,
  createNivelIntermediarioData,
  createNivelSuperiorData,
} from '../utils/summaryDataCreator';
import { generateWorkbook } from '../utils/workbookGenarator';

interface ModelRow {
  Pavimento: string;
  Unidade: string;
  Nome: string;
  [key: string]: any; // Permite propriedades adicionais com string como chave
}

interface ProcessingInput {
  selectedVNFile: File;
  selectedModelFile: File;
  selectedVNFile2?: File | null;
  selectedInterval: number;
  includeCargaTermica: boolean;
  additionalFile?: File | null;
  additionalFile2?: File | null;
  includeModeloReal?: boolean;
}

const BATCH_SIZE = 20;

const processFiles = async (input: ProcessingInput) => {
  const {
    selectedVNFile,
    selectedModelFile,
    selectedVNFile2,
    selectedInterval,
    includeCargaTermica,
    additionalFile,
    additionalFile2,
    includeModeloReal,
  } = input;

  const filteredDataCache: { [key: string]: any[] } = {};
  let areaColumnExists = false;

  const processCargaTermica = async (
    tipoAmbiente: string,
    codigo: string,
    filteredData: any[],
  ) => {
    let carga = 0;
    let cargaResfrValue = 0;

    if (includeCargaTermica && additionalFile) {
      try {
        const cargaData = await parseFile(additionalFile);
        const cargaFilteredData = filterData(cargaData, tipoAmbiente);
        const numericSelectedInterval = selectedInterval;

        const cargaTermicaResult = await cargaTerm({
          cargaFilteredData,
          filteredData,
          codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
          codigoSolo: codigo,
          thresholdVar: numericSelectedInterval,
        });

        cargaResfrValue = calculateCargaResfr(
          cargaFilteredData,
          codigo,
          numericSelectedInterval,
        );
        carga = cargaTermicaResult;
      } catch (error) {
        console.error('Erro ao processar arquivo de Carga Térmica:', error);
      }
    }

    return { carga, cargaResfrValue };
  };

  const processModelRow = async (
    modelRow: ModelRow,
    vnData: any[],
    selectedInterval: number,
    includeCargaTermica: boolean,
    additionalFile: File | null,
    areaColumnExists: boolean,
  ) => {
    const tipoAmbiente = modelRow['Tipo de ambiente'];
    const areaUh = areaColumnExists ? modelRow['Area'] : undefined;
    const codigo = modelRow['Código'];

    if (!codigo || !tipoAmbiente) {
      console.warn(
        'Skipping row due to missing Código or Tipo de ambiente:',
        modelRow,
      );
      return null;
    }

    // Aplica o filtro diretamente sem cache
    const filteredData = filterData(vnData, tipoAmbiente);

    const minTemp = roundUpToTwoDecimals(
      getMinTemperature(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
      ),
    );
    const maxTemp = roundUpToTwoDecimals(
      getMaxTemperature(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
      ),
    );
    const nhftValue = roundUpToTwoDecimals(
      getNhftValue(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
        selectedInterval,
      ),
    );

    const phftValue = roundUpToTwoDecimals(
      tipoAmbiente === 'Quarto'
        ? (nhftValue / 3650) * 100
        : tipoAmbiente === 'Misto'
          ? (nhftValue / 6570) * 100
          : (nhftValue / 2920) * 100,
    );

    const { carga, cargaResfrValue } = await processCargaTermica(
      tipoAmbiente,
      codigo,
      filteredData,
    );

    return {
      Pavimento: modelRow['Pavimento'],
      Unidade: modelRow['Unidade'],
      Código: codigo,
      Nome: modelRow['Nome'],
      'Tipo de ambiente': tipoAmbiente,
      ...(areaColumnExists && { Area: areaUh }),
      'MIN TEMP': minTemp,
      'MAX TEMP': maxTemp,
      NHFT: nhftValue,
      PHFT: phftValue,
      'CARGA RESF': includeCargaTermica
        ? roundUpToTwoDecimals(carga - cargaResfrValue)
        : undefined,
      'CARGA AQUE': includeCargaTermica
        ? roundUpToTwoDecimals(cargaResfrValue)
        : undefined,
      'CARGA TERM': includeCargaTermica
        ? roundUpToTwoDecimals(carga)
        : undefined,
    };
  };

  try {
    const vnData = await parseFile(selectedVNFile);

    const modelData = await parseModelExcel(selectedModelFile);

    const cleanOutputData: any[] = [];
    for (let i = 0; i < modelData.length; i += BATCH_SIZE) {
      const batch = modelData.slice(i, i + BATCH_SIZE);
      const batchOutput = await Promise.all(
        batch.map((modelRow) =>
          processModelRow(
            modelRow,
            vnData,
            selectedInterval,
            includeCargaTermica,
            additionalFile as File,
            areaColumnExists,
          ),
        ),
      );
      cleanOutputData.push(...batchOutput.filter((row) => row !== null));

      // Limpeza de memória
      batch.length = 0; // Libera memória usada pelo lote
    }

    const summaryData = createSummaryData(cleanOutputData);

    const sheets: { [sheetName: string]: any[] } = {
      Output: cleanOutputData,
      Summary: summaryData,
    };

    if (includeModeloReal && selectedVNFile2) {
      const vnData2 = await parseFile(selectedVNFile2);

      const outputModelRealData = [];
      for (let i = 0; i < modelData.length; i += BATCH_SIZE) {
        const batch = modelData.slice(i, i + BATCH_SIZE);
        const batchOutput2 = await Promise.all(
          batch.map((modelRow) =>
            processModelRow(
              modelRow,
              vnData2,
              selectedInterval,
              includeCargaTermica,
              additionalFile2 as File,
              areaColumnExists,
            ),
          ),
        );
        outputModelRealData.push(...batchOutput2.filter((row) => row !== null));
      }

      const summaryModelRealData = createSummaryData(outputModelRealData);
      console.log('FOiSumaruioReal' + summaryModelRealData);
      sheets['Modelo Real Output'] = outputModelRealData;
      sheets['Modelo Real Summary'] = summaryModelRealData;

      const nivelMinimoData = createNivelMinimoData(
        summaryData,
        summaryModelRealData,
      );
      sheets['Análise de Nível Mínimo'] = nivelMinimoData;

      if (includeCargaTermica) {
        sheets['Análise de Nível Intermediario'] = createNivelIntermediarioData(
          summaryData,
          summaryModelRealData,
        );
        sheets['Análise de Nível Superior'] = createNivelSuperiorData(
          summaryData,
          summaryModelRealData,
        );
      }
    }

    const workbookArrayBuffer = await generateWorkbook(sheets);

    postMessage({
      type: 'complete',
      workbook: workbookArrayBuffer,
    });
  } catch (error) {
    postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

self.addEventListener('message', (event: MessageEvent) => {
  const input = event.data;
  processFiles(input);
});

export {};
