import { roundUpToTwoDecimals, roundToOneDecimal } from '../utils/dataUtils';

export const createSummaryData = (cleanOutputData: any[]) => {
  const summaryMap: Record<string, any> = {};

  cleanOutputData.forEach((row) => {
    if (row) {
      const key = `${row.Pavimento}_${row.Unidade}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          Pavimento: row.Pavimento,
          Unidade: row.Unidade,
          MinTemp: row['MIN TEMP'],
          MaxTemp: row['MAX TEMP'],
          PHFT_Sum: row['PHFT'] || 0,
          CargaTermica_Sum: row['CARGA TERM'] || 0,
          Area: row['Area'],
          Count: 1,
        };
      } else {
        summaryMap[key].MinTemp = Math.min(
          summaryMap[key].MinTemp,
          row['MIN TEMP'],
        );
        summaryMap[key].MaxTemp = Math.max(
          summaryMap[key].MaxTemp,
          row['MAX TEMP'],
        );
        summaryMap[key].PHFT_Sum += row['PHFT'] || 0;
        summaryMap[key].CargaTermica_Sum += row['CARGA TERM'] || 0;
        summaryMap[key].Area += row['Area'];
        summaryMap[key].Count += 1;
      }
    }
  });

  // Mapeamento para estrutura final
  return Object.values(summaryMap).map((entry) => {
    const PHFT_Avg = entry.PHFT_Sum / entry.Count;
    let PHFT_Min = 0;
    let RedCgTTmin = 0;
    let PHFT_Min_Sup = 0;
    let RedCgTTmin_Sup = 0;

    // Cálculos para PHFT_Min e RedCgTTmin como já definido
    if (PHFT_Avg < 70) {
      const pavimentos = new Set(
        cleanOutputData.map((row) => row.Pavimento.toLowerCase()),
      );

      if (pavimentos.size === 1) {
        PHFT_Min = 45 - 0.58 * PHFT_Avg;
      } else {
        const pavimentoLower = entry.Pavimento.toLowerCase();
        if (pavimentoLower.includes('cobertura')) {
          PHFT_Min = 18 - 0.18 * PHFT_Avg;
        } else if (
          pavimentoLower.includes('térreo') ||
          pavimentoLower.includes('terreo')
        ) {
          PHFT_Min = 22 - 0.21 * PHFT_Avg;
        } else {
          PHFT_Min = 28 - 0.27 * PHFT_Avg;
        }
      }
      PHFT_Min_Sup = PHFT_Min; // Mesmo cálculo para nível superior
    } else {
      const cargaTermicaPorArea = entry.CargaTermica_Sum / entry.Area;

      if (cargaTermicaPorArea < 100) {
        RedCgTTmin = entry.Count === 1 ? 17 : 15;
      } else {
        RedCgTTmin = entry.Count === 1 ? 27 : 20;
      }
    }
    // Cálculo de RedCgTTmin_Sup, independentemente de PHFT_Avg
    const cargaTermicaPorArea = entry.CargaTermica_Sum / entry.Area;

    if (cargaTermicaPorArea < 100) {
      RedCgTTmin_Sup = entry.Count === 1 ? 35 : 30;
    } else {
      RedCgTTmin_Sup = entry.Count === 1 ? 55 : 40;
    }

    // Retorno dos dados formatados para a tabela
    return {
      Pavimento: entry.Pavimento ?? 0,
      Unidade: entry.Unidade ?? 0,
      MinTemp: roundToOneDecimal(entry.MinTemp) ?? 0,
      MaxTemp: roundToOneDecimal(entry.MaxTemp) ?? 0,
      PHFT_Avg: roundUpToTwoDecimals(PHFT_Avg) ?? 0,
      PHFT_Min: roundUpToTwoDecimals(PHFT_Min) ?? 0,
      CargaTermica_Sum: roundUpToTwoDecimals(entry.CargaTermica_Sum) ?? 0,
      RedCgTTmin: roundUpToTwoDecimals(RedCgTTmin) ?? 0,
      PHFT_Min_Sup: PHFT_Min_Sup ?? 0,
      RedCgTTmin_Sup: RedCgTTmin_Sup ?? 0,
    };
  });
};

type NivelMinimoData = {
  Pavimento: string;
  'Unidades Habitacionais': any; // Altere `any` para o tipo apropriado
  'Temp Max REF UH': number | null;
  'Temp Max REAL UH': number | null;
  'PHFT REF UH': number | null; // Altere `number` para o tipo apropriado
  'PHFT REAL UH': number | null; // Altere `number` para o tipo apropriado
  Status: string;
};

export const createNivelMinimoData = (
  summaryData: any[],
  summaryModelRealData: any[],
): NivelMinimoData[] => {
  const nivelMinimoMap: { [key: string]: NivelMinimoData } = {};

  console.log('All rows in summaryData:', summaryData);

  // Preencher o mapa com dados das unidades habitacionais do modelo ref
  summaryData.forEach((row) => {
    const pavimento = row.Pavimento;
    const unidade = row.Unidade;
    const key = `${pavimento}-${unidade}`; // Chave única por pavimento e unidade

    if (!nivelMinimoMap[key]) {
      nivelMinimoMap[key] = {
        Pavimento: pavimento,
        'Unidades Habitacionais': unidade,
        'Temp Max REF UH': row['MaxTemp'],
        'Temp Max REAL UH': null, // Para ser preenchido depois
        'PHFT REF UH': roundUpToTwoDecimals(row['PHFT_Avg'] * 0.9), // Multiplicar diretamente por 0.9
        'PHFT REAL UH': null, // Para ser preenchido depois
        Status: '',
      };
    } else {
      // Se a unidade já existe, atualize os valores
      nivelMinimoMap[key]['Temp Max REF UH'] = Math.max(
        nivelMinimoMap[key]['Temp Max REF UH'] as number,
        row['MaxTemp'],
      );
      nivelMinimoMap[key]['PHFT REF UH'] =
        ((nivelMinimoMap[key]['PHFT REF UH'] as number) +
          row['PHFT_Avg'] * 0.9) /
        2; // Calcular a média com ajuste de 0.9
    }
  });

  // Ajustar o valor de Temp Max REF UH diretamente na tabela com base na condição
  Object.values(nivelMinimoMap).forEach((item) => {
    const pavimento = item['Pavimento'];

    // Definir o valor de incremento com base no pavimento
    const tempThreshold =
      pavimento === 'Cobertura' || pavimento === 'cobertura' ? 2 : 1;

    // Alterar diretamente o valor de Temp Max REF UH
    item['Temp Max REF UH'] =
      (item['Temp Max REF UH'] as number) + tempThreshold;
  });

  // Preencher os dados do modelo real
  summaryModelRealData.forEach((row) => {
    const pavimento = row.Pavimento;
    const unidade = row.Unidade;
    const key = `${pavimento}-${unidade}`; // Chave única por pavimento e unidade

    if (nivelMinimoMap[key]) {
      // Preencher os valores reais
      nivelMinimoMap[key]['Temp Max REAL UH'] = row['MaxTemp'];
      nivelMinimoMap[key]['PHFT REAL UH'] = row['PHFT_Avg'];
    }
  });

  // Verificar status após todos os valores serem preenchidos
  Object.values(nivelMinimoMap).forEach((item) => {
    const tempNormal = item['Temp Max REF UH'] as number;
    const phftNormal = item['PHFT REF UH'] as number;
    const tempReal = item['Temp Max REAL UH'] as number;
    const phftReal = item['PHFT REAL UH'] as number;
    const isTempRealValid = tempReal !== null;
    const isPhftRealValid = phftReal !== null;
    const isTempNormalValid = tempNormal !== null;
    const isPhftNormalValid = phftNormal !== null;

    item['Status'] =
      isTempRealValid &&
      isTempNormalValid &&
      tempReal < tempNormal &&
      isPhftRealValid &&
      isPhftNormalValid &&
      phftReal > phftNormal
        ? 'ATENDIDO'
        : 'NÃO ATENDIDO';
  });

  return Object.values(nivelMinimoMap);
};

interface NivelIntermediarioData {
  Pavimento: string;
  Unidade: string;
  PHFT_Min: number | null;
  'Delta PHFT': number | null;
  RedCgTTmin: number | null;
  RedCgTT: number | null;
  Status: string;
}

export const createNivelIntermediarioData = (
  summaryData: any[],
  summaryModelRealData: any[],
): NivelIntermediarioData[] => {
  const nivelIntermediarioMap: { [key: string]: NivelIntermediarioData } = {};

  // Preencher o mapa com dados do modelo de referência
  summaryData.forEach((row) => {
    const key = `${row.Pavimento}-${row.Unidade}`;

    if (!nivelIntermediarioMap[key]) {
      nivelIntermediarioMap[key] = {
        Pavimento: row.Pavimento,
        Unidade: row.Unidade,
        PHFT_Min: row['PHFT_Min'] || null,
        'Delta PHFT': null,
        RedCgTTmin: row['RedCgTTmin'] !== undefined ? row['RedCgTTmin'] : 0,
        RedCgTT: row['CargaTermica_Sum'] || null,
        Status: '',
      };
    }
  });

  // Preencher dados do modelo real e calcular deltas
  summaryModelRealData.forEach((row) => {
    const key = `${row.Pavimento}-${row.Unidade}`;
    const refData = nivelIntermediarioMap[key];

    if (refData) {
      // Calcular os deltas
      refData['Delta PHFT'] = (row['PHFT_Avg'] || 0) - (refData.PHFT_Min || 0);

      // Calcular e arredondar RedCgTT para cima com duas casas decimais
      const redCgTTValue =
        (1 - (row['CargaTermica_Sum'] || 0) / (refData['RedCgTT'] || 1)) * 100;
      refData['RedCgTT'] = Math.ceil(redCgTTValue * 100) / 100;
    }
  });

  // Avaliar o status de cada unidade
  Object.values(nivelIntermediarioMap).forEach((item) => {
    const phftConditionMet = (item['Delta PHFT'] || 0) > (item.PHFT_Min || 0);
    const redCgTTConditionMet = (item['RedCgTT'] || 0) > (item.RedCgTTmin || 0);

    item.Status =
      phftConditionMet && redCgTTConditionMet ? 'ATENDIDO' : 'NÃO ATENDIDO';
  });

  // Retornar os dados no formato final
  return Object.values(nivelIntermediarioMap);
};

interface NivelSuperiorDataOutput {
  Pavimento: string;
  Unidade: string;
  PHFT_Min: number | null;
  'Delta PHFT': number | null;
  RedCgTTmin: number | null;
  RedCgTT: number | null;
  Status: string;
}

export const createNivelSuperiorData = (
  summaryData: any[],
  summaryModelRealData: any[],
): NivelSuperiorDataOutput[] => {
  const nivelSuperiorMap: { [key: string]: NivelSuperiorDataOutput } = {};

  summaryData.forEach((row) => {
    const key = `${row.Pavimento}-${row.Unidade}`;
    if (!nivelSuperiorMap[key]) {
      nivelSuperiorMap[key] = {
        Pavimento: row.Pavimento,
        Unidade: row.Unidade,
        PHFT_Min: row['PHFT_Min_Sup']
          ? Math.ceil(row['PHFT_Min_Sup'] * 100) / 100
          : null,
        'Delta PHFT': null,
        RedCgTTmin: row['RedCgTTmin'] !== undefined ? row['RedCgTTmin'] : 0,
        RedCgTT: row['CargaTermica_Sum'] || null,
        Status: '',
      };
    }
  });

  summaryModelRealData.forEach((row) => {
    const key = `${row.Pavimento}-${row.Unidade}`;
    if (nivelSuperiorMap[key]) {
      const deltaPhft =
        (row['PHFT_Avg'] || 0) - (nivelSuperiorMap[key]['PHFT_Min'] || 0);

      const deltaRedCgTT =
        (1 -
          (row['CargaTermica_Sum'] || 0) /
            (nivelSuperiorMap[key]['RedCgTT'] || 0)) *
        100;

      // Arredondar para cima para duas casas decimais
      nivelSuperiorMap[key]['Delta PHFT'] = Math.ceil(deltaPhft * 100) / 100;
      nivelSuperiorMap[key]['RedCgTT'] = Math.ceil(deltaRedCgTT * 100) / 100;
    }
  });

  Object.values(nivelSuperiorMap).forEach((item) => {
    const phftConditionMet =
      item['Delta PHFT'] !== null && item['Delta PHFT'] > (item.PHFT_Min || 0);

    const redCgTTConditionMet =
      item['RedCgTT'] !== null && item['RedCgTT'] > (item.RedCgTTmin || 0);

    item.Status =
      phftConditionMet && redCgTTConditionMet ? 'ATENDIDO' : 'NÃO ATENDIDO';
  });

  return Object.values(nivelSuperiorMap);
};
