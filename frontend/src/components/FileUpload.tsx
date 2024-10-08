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
          'PHFT REF UH': row['PHFT_Avg'],
          'Temp Max REAL UH': null, // Para ser preenchido depois
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

            // Converte cada linha da planilha para um objeto JSON
            worksheet.eachRow(
              { includeEmpty: true },
              (
                row: {
                  eachCell: (
                    arg0: { includeEmpty: boolean },
                    arg1: (cell: any, colNumber: any) => void,
                  ) => void;
                },
                rowNumber: number,
              ) => {
                if (rowNumber > 1) {
                  // Ignora o cabeçalho (primeira linha)
                  const rowData: ModelRow = {
                    Pavimento: '',
                    Unidade: '',
                    Nome: '',
                  };
                  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const columnName = worksheet.getRow(1).getCell(colNumber)
                      .value as string; // Obtém o nome da coluna
                    rowData[columnName] = cell.value; // Adiciona ao objeto com o nome da coluna
                  });
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
    const processCargaTermica = async (
      tipoAmbiente: string,
      codigo: string,
      filteredData: any[],
      cargaTermicaCache: Map<string, any>, // Cache para evitar processamento repetido
    ) => {
      let carga = 0;
      let cargaResfrValue = 0;

      if (includeCargaTermica && additionalFile) {
        const cacheKey = `${codigo}_${tipoAmbiente}`;
        // Verificar se o resultado já está no cache
        if (cargaTermicaCache.has(cacheKey)) {
          const cachedResult = cargaTermicaCache.get(cacheKey);
          return {
            carga: cachedResult.carga,
            cargaResfrValue: cachedResult.cargaResfrValue,
          };
        }

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

          // Armazenar o resultado no cache
          cargaTermicaCache.set(cacheKey, { carga, cargaResfrValue });
        } catch (error) {
          console.error('Erro ao processar arquivo de Carga Térmica:', error);
        }
      }

      return { carga, cargaResfrValue };
    };

    // Função para processar cada linha do modelo com cache otimizado
    const processModelRow = async (
      modelRow: ModelRow,
      vnData: any[],
      selectedInterval: number,
      includeCargaTermica: boolean,
      additionalFile: File | null,
      cargaTermicaCache: Map<string, any>, // Cache para carga térmica
    ) => {
      const tipoAmbiente = modelRow['Tipo de ambiente'];
      const codigo = modelRow['Código'];

      if (!codigo || !tipoAmbiente) {
        console.warn(
          'Skipping row due to missing Código or Tipo de ambiente:',
          modelRow,
        );
        return null;
      }

      const filteredData = filterData(vnData, tipoAmbiente);
      const minTemp = getMinTemperature(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
      );
      const maxTemp = getMaxTemperature(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
      );
      const nhftValue = getNhftValue(
        filteredData,
        `${codigo}:Zone Operative Temperature [C](Hourly)`,
        selectedInterval,
      );

      const phftValue =
        tipoAmbiente === 'Quarto'
          ? (nhftValue / 3650) * 100
          : tipoAmbiente === 'Misto'
            ? (nhftValue / 6570) * 100
            : (nhftValue / 2920) * 100;

      const { carga, cargaResfrValue } = await processCargaTermica(
        tipoAmbiente,
        codigo,
        filteredData,
        cargaTermicaCache,
      );

      return {
        Pavimento: modelRow['Pavimento'],
        Unidade: modelRow['Unidade'],
        Código: codigo,
        Nome: modelRow['Nome'],
        'Tipo de ambiente': tipoAmbiente,
        'MIN TEMP': minTemp,
        'MAX TEMP': maxTemp,
        NHFT: nhftValue,
        PHFT: phftValue,
        'CARGA RESF': includeCargaTermica ? carga - cargaResfrValue : undefined,
        'CARGA AQUE': includeCargaTermica ? cargaResfrValue : undefined,
        'CARGA TERM': includeCargaTermica ? carga : undefined,
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
          Count: 1,
        };
      } else {
        summaryMap[key].MinTemp = Math.min(
          summaryMap[key].MinTemp,
          row['MIN TEMP']
        );
        summaryMap[key].MaxTemp = Math.max(
          summaryMap[key].MaxTemp,
          row['MAX TEMP']
        );
        summaryMap[key].PHFT_Sum += row['PHFT'] || 0;
        summaryMap[key].CargaTermica_Sum += row['CARGA TERM'] || 0;
        summaryMap[key].Count += 1;
      }
    }
  });

  return Object.values(summaryMap).map((entry) => {
    const PHFT_Avg = entry.PHFT_Sum / entry.Count;
    let PHFT_Min = 0; // Inicializa como 0 para o caso PHFT_Avg > 70

    if (PHFT_Avg < 70) {
      // Lógica para pavimentos sem variedade
      const pavimentos = new Set(
        cleanOutputData.map((row) => row.Pavimento.toLowerCase())
      );
      
      if (pavimentos.size === 1) {
        PHFT_Min = 45 - 0.58 * PHFT_Avg;
      } else {
        // Lógica para pavimentos com variedade
        const pavimentoLower = entry.Pavimento.toLowerCase();
        if (pavimentoLower.includes('cobertura')) {
          PHFT_Min = 18 - 0.18 * PHFT_Avg;
        } else if (pavimentoLower.includes('térreo') || pavimentoLower.includes('terreo')) {
          PHFT_Min = 22 - 0.21 * PHFT_Avg;
        } else {
          PHFT_Min = 28 - 0.27 * PHFT_Avg;
        }
      }
    }

    return {
      Pavimento: entry.Pavimento,
      Unidade: entry.Unidade,
      MinTemp: entry.MinTemp,
      MaxTemp: entry.MaxTemp,
      PHFT_Avg: PHFT_Avg,
      PHFT_Min: PHFT_Min,
      CargaTermica_Sum: entry.CargaTermica_Sum,
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

        // Inicializar o cache de Carga Térmica
        const cargaTermicaCache = new Map<string, any>();

        const outputData = await Promise.all(
          modelData.map((modelRow) =>
            processModelRow(
              modelRow,
              vnData,
              selectedInterval,
              includeCargaTermica,
              additionalFile,
              cargaTermicaCache, // Passar o cache
            ),
          ),
        );

        const cleanOutputData = outputData.filter((row) => row !== null);
        const summaryData = createSummaryData(cleanOutputData);

        const sheets: { [sheetName: string]: any[] } = {
          Output: cleanOutputData,
          Summary: summaryData,
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
                cargaTermicaCache,
              ),
            ),
          );

          const cleanOutputModelRealData = outputModelRealData.filter(
            (row) => row !== null,
          );
          const summaryModelRealData = createSummaryData(
            cleanOutputModelRealData,
          );

          sheets['Modelo Real Output'] = cleanOutputModelRealData;
          sheets['Modelo Real Summary'] = summaryModelRealData;

          const nivelMinimoData = createNivelMinimoData(
            summaryData,
            summaryModelRealData,
          );
          sheets['Análise de Nível Mínimo'] = nivelMinimoData;
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
