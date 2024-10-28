import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';
import './FileUpload.css';
import {
  filterData,
  getMaxTemperature,
  getMinTemperature,
  getNhftValue,
} from '../utils/dataUtils';
import { cargaTerm, calculateCargaResfr } from '../utils/cargaUtils';
import { processExcelFile, processCsvFile } from '../utils/fileProcessing';
import FileDropZone from './FileDropzone';
import FileActions from './FileActions';
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [includeCargaTermica, setIncludeCargaTermica] =
    useState<boolean>(false);
  const [includeModeloReal, setIncludeModeloReal] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [selectedVNFile2, setSelectedVNFile2] = useState<File | null>(null);

  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [additionalFile2, setAdditionalFile2] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<Blob | null>(null);

  const [selectedInterval, setSelectedInterval] = useState<number>(26);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initialize as false
  const [canGenerate, setCanGenerate] = useState(false);

  useEffect(() => {
    const hasVNFile = !!selectedVNFile;
    const hasModelFile = !!selectedModelFile;
    const hasCargaTermicaFile = !includeCargaTermica || !!additionalFile;
    const hasVNFile2 = !includeModeloReal || !!selectedVNFile2;

    setCanGenerate(
      hasVNFile && hasModelFile && hasCargaTermicaFile && hasVNFile2,
    );
  }, [
    selectedVNFile,
    selectedModelFile,
    additionalFile,
    includeCargaTermica,
    selectedVNFile2,
    includeModeloReal,
  ]);

  // Função para exibir toasts de erro detalhado
  const notifyError = (message: string, p0: any) => {
    toast.error(`${message}: ${p0}`);
  };

  const handleDeleteVNFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the input from opening
    setSelectedVNFile(null);
    dispatch(setFile(null));
  };

  const handleDeleteModelFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the input from opening
    setSelectedModelFile(null);
    dispatch(setModelFile(null));
  };

  const handleDeleteVNFile2 = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the input from opening
    setSelectedVNFile2(null);
    dispatch(setFile(null));
  };

  const handleDeleteAdditionalFile = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation(); // Prevent the input from opening
    setAdditionalFile(null);
  };

  const handleDeleteAdditionalFile2 = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation(); // Prevent the input from opening
    setAdditionalFile2(null);
  };

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileType: string) => {
      const file = acceptedFiles[0];
      if (file) {
        try {
          if (fileType === 'csv') {
            setSelectedVNFile(file);
            dispatch(setFile(file));
            processCsvFile(file);
          } else if (fileType === 'xlsx') {
            setSelectedModelFile(file);
            dispatch(setModelFile(file));
            processExcelFile(file);
          }
        } catch (error) {
          notifyError('Falha ao processar o arquivo', error);
        }
      } else {
        notifyError('Nenhum arquivo aceito', null);
      }
    },
    [dispatch],
  );

  const handleDrop2 = useCallback(
    (acceptedFiles: File[], fileType: string) => {
      const file = acceptedFiles[0];
      if (file) {
        try {
          if (fileType === 'csv') {
            setSelectedVNFile2(file);
            dispatch(setFile(file));
            processCsvFile(file);
          } else if (fileType === 'xlsx') {
            dispatch(setModelFile(file));
            processExcelFile(file);
          }
        } catch (error) {
          notifyError('Falha ao processar o arquivo', error);
        }
      } else {
        notifyError('Nenhum arquivo aceito', null);
      }
    },
    [dispatch],
  );

  const handleDropVN = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleDrop(acceptedFiles, 'csv');
      }
    },
    [handleDrop],
  );

  const handleDropModel = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleDrop(acceptedFiles, 'xlsx');
      }
    },
    [handleDrop],
  );

  const handleDropCargaTermica = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAdditionalFile(acceptedFiles[0]);
    }
  }, []);

  const handleDropVN2 = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleDrop2(acceptedFiles, 'csv');
      }
    },
    [handleDrop2],
  );

  const handleDropCargaTermica2 = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAdditionalFile2(acceptedFiles[0]);
    }
  }, []);

  type NivelMinimoData = {
    Pavimento: string;
    'Unidades Habitacionais': any; // Altere `any` para o tipo apropriado
    'Temp Max REF UH': number | null;
    'Temp Max REAL UH': number | null;
    'PHFT REF UH': number | null; // Altere `number` para o tipo apropriado
    'PHFT REAL UH': number | null; // Altere `number` para o tipo apropriado
    Status: string;
  };

  const createNivelMinimoData = (
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
          'PHFT REF UH': row['PHFT_Avg'],
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
          ((nivelMinimoMap[key]['PHFT REF UH'] as number) + row['PHFT_Avg']) /
          2; // Calcular a média
      }
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
      const { 'Temp Max REF UH': tempNormal, 'PHFT REF UH': phftNormal } = item;
      const { 'Temp Max REAL UH': tempReal, 'PHFT REAL UH': phftReal } = item;

      const isTempRealValid = tempReal !== null;
      const isPhftRealValid = phftReal !== null;
      const isTempNormalValid = tempNormal !== null;
      const isPhftNormalValid = phftNormal !== null;

      const pavimento = item['Pavimento'];

      // Verifica se o pavimento é "Cobertura" ou "cobertura"
      if (pavimento === 'Cobertura' || pavimento === 'cobertura') {
        item['Status'] =
          (isTempRealValid && isTempNormalValid && tempReal < tempNormal + 2) ||
          (isPhftRealValid && isPhftNormalValid && phftReal > 0.9 * phftNormal)
            ? 'NÃO ATENDIDO'
            : 'ATENDIDO';
      } else {
        // Para outros tipos de pavimento
        item['Status'] =
          (isTempRealValid && isTempNormalValid && tempReal < tempNormal + 1) ||
          (isPhftRealValid && isPhftNormalValid && phftReal > 0.9 * phftNormal)
            ? 'NÃO ATENDIDO'
            : 'ATENDIDO';
      }
    });

    return Object.values(nivelMinimoMap);
  };

  interface NivelIntermediarioData {
    Pavimento: string;
    Unidade: string;
    PHFT_Min: number | null;
    'Delta PHFT': number | null;
    RedCgTTmin: number | null;
    RedCttg: number | null;
    Status: string;
  }

  const createNivelIntermediarioData = (
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
          RedCgTTmin: row['RedCgTTmin'] || null,
          'Delta PHFT': null,
          RedCttg: row['CargaTermica_Sum'] || null,
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
        refData['Delta PHFT'] =
          (row['PHFT_Avg'] || 0) - (refData.PHFT_Min || 0);
        refData['RedCttg'] =
          (nivelIntermediarioMap[key]['RedCttg'] || 0) -
          (row['CargaTermica_Sum'] || 0);
      }
    });

    // Avaliar o status de cada unidade
    Object.values(nivelIntermediarioMap).forEach((item) => {
      const phftConditionMet = (item['Delta PHFT'] || 0) > (item.PHFT_Min || 0);
      const redCttgConditionMet =
        (item['RedCttg'] || 0) > (item.RedCgTTmin || 0);

      item.Status =
        phftConditionMet || redCttgConditionMet ? 'NÃO ATENDIDO' : 'ATENDIDO';
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
    RedCttg: number | null;
    Status: string;
  }

  const createNivelSuperiorData = (
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
          PHFT_Min: row['PHFT_Min_Sup'] || null,
          'Delta PHFT': null,
          RedCgTTmin: row['RedCgTTmin_Sup'] || null,
          RedCttg: row['CargaTermica_Sum'] || null,
          Status: '',
        };
      }
    });

    summaryModelRealData.forEach((row) => {
      const key = `${row.Pavimento}-${row.Unidade}`;
      if (nivelSuperiorMap[key]) {
        const deltaPhft =
          (row['PHFT_Avg'] || 0) - (nivelSuperiorMap[key]['PHFT_Min'] || 0);

        const deltaRedCttg =
          (nivelSuperiorMap[key]['RedCttg'] || 0) -
          (row['CargaTermica_Sum'] || 0);

        nivelSuperiorMap[key]['Delta PHFT'] = deltaPhft;
        nivelSuperiorMap[key]['RedCttg'] = deltaRedCttg;
      }
    });

    Object.values(nivelSuperiorMap).forEach((item) => {
      const phftConditionMet =
        item['Delta PHFT'] !== null &&
        item['Delta PHFT'] > (item.PHFT_Min || 0);

      const redCttgConditionMet =
        item['RedCttg'] !== null && item['RedCttg'] > (item.RedCgTTmin || 0);

      item.Status =
        phftConditionMet || redCttgConditionMet ? 'NÃO ATENDIDO' : 'ATENDIDO';
    });

    return Object.values(nivelSuperiorMap);
  };

  interface ModelRow {
    Pavimento: string;
    Unidade: string;
    Nome: string;
    [key: string]: any; // Permite propriedades adicionais com string como chave
  }

  // Função principal para gerar o arquivo de saída
  const generateOutputFile = async () => {
    // Função para parsear arquivos CSV usando PapaParse
    const parseFile = (file: File): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (results: Papa.ParseResult<any>) => resolve(results.data),
          error: (error: any) => reject(error),
        });
      });
    };
    let areaColumnExists = false;
    // Função para parsear arquivos Excel usando FileReader e ExcelJS
    const parseModelExcel = (file: File): Promise<ModelRow[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);

            // Criação de um novo workbook e leitura do arquivo
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data); // Carrega o buffer com o arquivo Excel

            const worksheet = workbook.worksheets[0]; // Obtém a primeira planilha
            const jsonData: ModelRow[] = [];

            // Verifica se a primeira linha existe
            const headerRow = worksheet.getRow(1);

            if (headerRow && headerRow.values) {
              // Verifica se `headerRow.values` é um array
              if (Array.isArray(headerRow.values)) {
                // Verifica se a coluna "Area" existe no cabeçalho (em um array esparso)
                areaColumnExists = headerRow.values.includes('Area');
              } else {
                // Se `headerRow.values` for um objeto, converte os valores em um array e verifica
                areaColumnExists = Object.values(headerRow.values).includes(
                  'Area',
                );
              }
            }

            // Converte cada linha da planilha para um objeto JSON
            worksheet.eachRow(
              { includeEmpty: true },
              (row: any, rowNumber: number) => {
                if (rowNumber > 1) {
                  // Ignora o cabeçalho (primeira linha)
                  const rowData: ModelRow = {
                    Pavimento: '',
                    Unidade: '',
                    Nome: '',
                  };

                  row.eachCell(
                    { includeEmpty: true },
                    (cell: any, colNumber: any) => {
                      const columnName = headerRow.getCell(colNumber)
                        ?.value as string; // Obtém o nome da coluna

                      if (columnName === 'Area' && areaColumnExists) {
                        rowData['Area'] = cell.value; // Só adiciona "Area" se ela existir
                      } else {
                        rowData[columnName] = cell.value; // Adiciona as outras colunas normalmente
                      }
                    },
                  );

                  jsonData.push(rowData); // Adiciona a linha convertida ao array
                }
              },
            );

            resolve(jsonData); // Retorna os dados convertidos
          } catch (error) {
            reject(error); // Lida com erros
          }
        };

        reader.onerror = () => reject(new Error('Erro ao ler o arquivo Excel'));
        reader.readAsArrayBuffer(file); // Lê o arquivo como um ArrayBuffer
      });
    };

    // Função para processar Carga Térmica com otimização
    // Função para processar Carga Térmica sem otimização de cache
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

    const roundUpToTwoDecimals = (value: number): number => {
      return Math.ceil(value * 100) / 100;
    };

    const roundToOneDecimal = (value: number): number => {
      return Math.round(value * 10) / 10;
    };

    // Função para processar cada linha do modelo com cache otimizado
    const processModelRow = async (
      modelRow: ModelRow,
      vnData: any[],
      selectedInterval: number,
      includeCargaTermica: boolean,
      additionalFile: File | null,
      areaColumnExists: boolean, // Passar a variável como argumento
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

    // Função para criar dados de resumo
    // Função para criar dados de resumo com cálculo de PHFT Mínimo
    const createSummaryData = (cleanOutputData: any[]) => {
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
            RedCgTTmin_Sup = entry.Count === 1 ? 35 : 30;
          } else {
            RedCgTTmin = entry.Count === 1 ? 27 : 20;
            RedCgTTmin_Sup = entry.Count === 1 ? 55 : 40;
          }
        }

        // Retorno dos dados formatados para a tabela
        return {
          Pavimento: entry.Pavimento,
          Unidade: entry.Unidade,
          MinTemp: roundToOneDecimal(entry.MinTemp),
          MaxTemp: roundToOneDecimal(entry.MaxTemp),
          PHFT_Avg: roundUpToTwoDecimals(PHFT_Avg),
          PHFT_Min: roundUpToTwoDecimals(PHFT_Min),
          CargaTermica_Sum: roundUpToTwoDecimals(entry.CargaTermica_Sum),
          RedCgTTmin: roundUpToTwoDecimals(RedCgTTmin),
          PHFT_Min_Sup,
          RedCgTTmin_Sup,
        };
      });
    };

    const generateWorkbook = async (sheets: {
      [sheetName: string]: any[];
    }): Promise<Uint8Array> => {
      const workbook = new ExcelJS.Workbook();

      // Mapeamento de colunas para cores
      const colorMapping: { [key: string]: string } = {
        'MIN TEMP': 'FFFFC000', // Cor para MIN TEMP
        MaxTemp: 'a52a2a',
        MinTemp: 'FFFFC000',
        'MAX TEMP': 'a52a2a', // Cor para MAX TEMP
        'Temp Max REF UH': 'a52a2a',
        'Temp Max REAL UH': 'a52a2a',
        NHFT: 'FF00B0F0', // Cor para NHFT
        PHFT: '008000', // Cor para PHFT
        PHFT_Avg: '008000',
        'PHFT REF UH': '008000',
        'PHFT REAL UH': '008000',
      };

      for (const [sheetName, data] of Object.entries(sheets)) {
        const worksheet = workbook.addWorksheet(sheetName);

        // Adiciona cabeçalho
        const headerCells = Object.keys(data[0]);
        const headerRow = worksheet.addRow(headerCells);

        // Formatação do cabeçalho
        headerRow.eachCell((cell, colNumber) => {
          const columnName = cell.value as string;

          // Define cor personalizada se estiver no mapeamento
          const color = colorMapping[columnName] || 'FF4F81BD'; // Azul por padrão

          cell.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFFFF' }, // Cor da fonte (branca)
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }, // Cor personalizada ou padrão
          };
          cell.alignment = { horizontal: 'center' }; // Centralizar texto no cabeçalho
          worksheet.getColumn(colNumber).width = 20; // Aumenta a largura da célula
        });

        // Adiciona os dados
        data.forEach((row) => {
          const newRow = worksheet.addRow(Object.values(row));

          // Formatar as células conforme o nome das colunas
          Object.keys(row).forEach((key, index) => {
            const cell = newRow.getCell(index + 1); // +1 para ajustar ao índice da linha
            const color = colorMapping[key] || null;

            if (color) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: color }, // Cor personalizada para a célula
              };
            }
          });

          // Formatar as células de status, se a coluna 'Status' existir
          if (Object.prototype.hasOwnProperty.call(row, 'Status')) {
            const statusCell = newRow.getCell(
              headerCells.indexOf('Status') + 1,
            );
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: row.Status === 'ATENDIDO' ? 'FF00FF00' : 'FFFF0000', // Verde para APROVADO, vermelho para REPROVADO
              },
            };
          }
        });
      }

      // Gera o arquivo Excel como Buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Converte Blob para Uint8Array
      const uint8Array = await blobToUint8Array(blob);
      return uint8Array;
    };

    const blobToUint8Array = (blob: Blob): Promise<Uint8Array> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    };

    // Função para lidar com o processamento com cache de carga térmica
    const handleProcess = async () => {
      if (
        !selectedVNFile ||
        !selectedModelFile ||
        (includeModeloReal && !selectedVNFile2)
      ) {
        console.error('Arquivos necessários não foram selecionados.');
        return;
      }

      setIsLoading(true);
      console.log('Iniciando o processamento dos arquivos...');
      try {
        const vnData = await parseFile(selectedVNFile);
        const modelData = await parseModelExcel(selectedModelFile);

        const outputData = await Promise.all(
          modelData.map((modelRow) =>
            processModelRow(
              modelRow,
              vnData,
              selectedInterval,
              includeCargaTermica,
              additionalFile,
              areaColumnExists,
            ),
          ),
        );

        const cleanOutputData = outputData.filter((row) => row !== null);
        const summaryData = createSummaryData(cleanOutputData);
        const summaryDataToOutput = createSummaryData(cleanOutputData).map(
          ({ Pavimento, Unidade, MinTemp, MaxTemp, PHFT_Avg }) => ({
            Pavimento,
            Unidade,
            MinTemp,
            MaxTemp,
            PHFT_Avg, // Inclui apenas colunas desejadas na tabela final
          }),
        );

        const sheets: { [sheetName: string]: any[] } = {
          Output: cleanOutputData,
          Summary: summaryDataToOutput,
        };

        if (includeModeloReal && selectedVNFile2) {
          const vnData2 = await parseFile(selectedVNFile2);

          const outputModelRealData = await Promise.all(
            modelData.map((modelRow) =>
              processModelRow(
                modelRow,
                vnData2,
                selectedInterval,
                includeCargaTermica,
                additionalFile2,
                areaColumnExists,
              ),
            ),
          );

          const cleanOutputModelRealData = outputModelRealData.filter(
            (row) => row !== null,
          );
          const summaryModelRealData = createSummaryData(
            cleanOutputModelRealData,
          );
          const summaryModelRealDataToOutput = createSummaryData(
            cleanOutputModelRealData,
          ).map(({ Pavimento, Unidade, MinTemp, MaxTemp, PHFT_Avg }) => ({
            Pavimento,
            Unidade,
            MinTemp,
            MaxTemp,
            PHFT_Avg, // Inclui apenas colunas desejadas na tabela final
          }));

          sheets['Modelo Real Output'] = cleanOutputModelRealData;
          sheets['Modelo Real Summary'] = summaryModelRealDataToOutput;

          const nivelMinimoData = createNivelMinimoData(
            summaryData,
            summaryModelRealData,
          );
          sheets['Análise de Nível Mínimo'] = nivelMinimoData;
          if (includeCargaTermica) {
            const nivelIntermediarioData = createNivelIntermediarioData(
              summaryData,
              summaryModelRealData,
            );
            sheets['Análise de Nível Intermediario'] = nivelIntermediarioData;

            const nivelSuperiorData = createNivelSuperiorData(
              summaryData,
              summaryModelRealData,
            );
            sheets['Análise de Nível Superior'] = nivelSuperiorData;
          }
        }

        const workbookArrayBuffer = await generateWorkbook(sheets);

        setOutputFile(
          new Blob([workbookArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );
        console.log('Arquivo Excel gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao processar os arquivos:', error);
      } finally {
        setIsLoading(false);
        console.log('Processamento concluído.');
      }
    };

    // Chamar a função de processamento
    handleProcess();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Centraliza o conteúdo horizontalmente
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <h1 style={{ marginBottom: '20px' }}>Análise Térmica</h1>

      <div style={{ marginTop: '20px' }}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
        <label>
          <input
            type="checkbox"
            checked={includeModeloReal}
            onChange={() => setIncludeModeloReal(!includeModeloReal)}
          />
          Incluir Modelo Real
        </label>
      </div>

      {/* Agrupamento dos dropzones */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginTop: '20px',
          alignItems: 'center', // Centraliza todos os itens no centro
        }}
      >
        {/* Dropzones lado a lado */}
        <div style={{ display: 'flex', gap: '40px' }}>
          {/* Dropzone do VN REF */}
          <FileDropZone
            label="Arquivo de VN do Modelo REF"
            onDrop={handleDropVN}
            acceptMultipleFileTypes={true}
            selectedFile={selectedVNFile}
            onDelete={handleDeleteVNFile}
          />
          {/* Dropzone do VN Modelo Real, se estiver ativado */}
          {includeModeloReal && (
            <FileDropZone
              label="Arquivo de VN do Modelo Real"
              onDrop={handleDropVN2}
              acceptMultipleFileTypes={true}
              selectedFile={selectedVNFile2}
              onDelete={handleDeleteVNFile2}
            />
          )}
        </div>

        {/* Centralizar o dropzone do Modelo REF abaixo dos dois anteriores */}
        <FileDropZone
          label="Arquivo de Modelo do Modelo REF"
          onDrop={handleDropModel}
          selectedFile={selectedModelFile}
          onDelete={handleDeleteModelFile}
        />

        {/* Condicional para Carga Térmica */}
        {includeCargaTermica && (
          <div style={{ display: 'flex', gap: '40px' }}>
            <FileDropZone
              label="Arquivo de Carga Térmica do Modelo REF"
              onDrop={handleDropCargaTermica}
              acceptMultipleFileTypes={true}
              selectedFile={additionalFile}
              onDelete={handleDeleteAdditionalFile}
            />
            {includeModeloReal && (
              <FileDropZone
                label="Arquivo de Carga Térmica do Modelo Real"
                onDrop={handleDropCargaTermica2}
                acceptMultipleFileTypes={true}
                selectedFile={additionalFile2}
                onDelete={handleDeleteAdditionalFile2}
              />
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          Intervalo:
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(Number(e.target.value))}
          >
            <option value="26">
              Intervalo 1 - 18,0 °C &lt; ToAPPa &lt; 26,0 °C
            </option>
            <option value="28">Intervalo 2 - ToAPP &lt; 28,0 °C</option>
            <option value="30">Intervalo 3 - ToAPP &lt; 30,0 °C</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={includeCargaTermica}
            onChange={() => setIncludeCargaTermica(!includeCargaTermica)}
          />
          Incluir Carga Térmica
        </label>
      </div>

      <FileActions
        onGenerate={generateOutputFile}
        canGenerate={canGenerate}
        outputFile={outputFile}
        isLoading={isLoading}
        notifyError={notifyError}
      />
    </div>
  );
};

export default FileUpload;
