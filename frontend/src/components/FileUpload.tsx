import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import './FileUpload.css';
import { parseFile, parseModelExcel } from '../utils/parseFiles';
import {processModelRow, createSummaryData, generateWorkbook} from '../utils/utils'
import { processExcelFile, processCsvFile } from '../utils/fileProcessing';
import FileDropZone from './FileDropzone';
import FileActions from './FileActions';
import { toast, ToastContainer } from 'react-toastify';
import { initializeMap, calculateDeltas, evaluateStatus } from '../utils/analiseUtils';

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

  // Atualiza a condição para habilitar a geração de arquivos
  useEffect(() => {
    setCanGenerate(
      !!selectedVNFile &&
        !!selectedModelFile &&
        (!includeCargaTermica || !!additionalFile) &&
        (!includeModeloReal || !!selectedVNFile2)
    );
  }, [
    selectedVNFile,
    selectedModelFile,
    additionalFile,
    includeCargaTermica,
    selectedVNFile2,
    includeModeloReal,
  ]);

  // Notificação de erro
  const notifyError = (message: string) => toast.error(message);

  // Exclusão de arquivos
  const handleDeleteFile = (fileType: string) => {
    switch (fileType) {
      case 'VN':
        setSelectedVNFile(null);
        break;
      case 'Model':
        setSelectedModelFile(null);
        break;
      case 'VN2':
        setSelectedVNFile2(null);
        break;
      case 'Carga1':
        setAdditionalFile(null);
        break;
      case 'Carga2':
        setAdditionalFile2(null);
        break;
      default:
        return;
    }
    dispatch(setFile(null));
  };

  // Função para gerenciar arquivos carregados
  const handleFileDrop = (acceptedFiles: File[], type: string) => {
    const file = acceptedFiles[0];
    if (!file) {
      return notifyError('Nenhum arquivo aceito.');
    }

    try {
      switch (type) {
        case 'VN':
          setSelectedVNFile(file);
          dispatch(setFile(file));
          processCsvFile(file);
          break;
        case 'Model':
          setSelectedModelFile(file);
          dispatch(setModelFile(file));
          processExcelFile(file);
          break;
        case 'VN2':
          setSelectedVNFile2(file);
          dispatch(setFile(file));
          processCsvFile(file);
          break;
        case 'Carga1':
          setAdditionalFile(file);
          break;
        case 'Carga2':
          setAdditionalFile2(file);
          break;
        default:
          break;
      }
    } catch (error) {
      notifyError('Falha ao processar o arquivo.');
    }
  };

  type NivelMinimoData = {
    Pavimento: string;
    'Unidades Habitacionais': string;
    'Temp Max REF UH': number | null;
    'Temp Max REAL UH': number | null;
    'PHFT REF UH': number | null;
    'PHFT REAL UH': number | null;
    Status: string;
  };
  
  const createNivelMinimoData = (
    summaryData: any[],
    summaryModelRealData: any[],
  ): NivelMinimoData[] => {
    const initialFields = {
      'Temp Max REF UH': null,
      'Temp Max REAL UH': null,
      'PHFT REF UH': null,
      'PHFT REAL UH': null,
      Status: '',
    };
  
    const nivelMinimoMap = initializeMap(summaryData, ['Pavimento', 'Unidade'], initialFields);
  
    summaryModelRealData.forEach((row) => {
      const key = `${row.Pavimento}-${row.Unidade}`;
      if (nivelMinimoMap[key]) {
        nivelMinimoMap[key]['Temp Max REAL UH'] = row['MaxTemp'];
        nivelMinimoMap[key]['PHFT REAL UH'] = row['PHFT_Avg'];
      }
    });
  
    Object.values(nivelMinimoMap).forEach((item) => {
      const conditions = [
        item['Temp Max REAL UH'] < (item['Temp Max REF UH'] || 0) + 1,
        item['PHFT REAL UH'] > 0.9 * (item['PHFT REF UH'] || 0),
      ];
      item.Status = evaluateStatus(conditions, item.Pavimento);
    });
  
    return Object.values(nivelMinimoMap);
  };

  type NivelData = {
    Pavimento: string;
    Unidade: string;
    PHFT_Min: number | null;
    'Delta PHFT': number | null;
    RedCgTTmin: number | null;
    RedCgTT: number | null;
    Status: string;
  };
  
  const initializeNivelData = (
    summaryData: any[],
    minKey: string,
  ): Record<string, NivelData> => {
    const map: Record<string, NivelData> = {};
  
    summaryData.forEach((row) => {
      const key = `${row.Pavimento}-${row.Unidade}`;
      if (!map[key]) {
        map[key] = {
          Pavimento: row.Pavimento,
          Unidade: row.Unidade,
          PHFT_Min: row[minKey] ? Math.ceil(row[minKey] * 100) / 100 : null,
          'Delta PHFT': null,
          RedCgTTmin: row['RedCgTTmin'] ?? 0,
          RedCgTT: row['CargaTermica_Sum'] ?? null,
          Status: '',
        };
      }
    });
  
    return map;
  };
  
  const updateNivelData = (
    map: Record<string, NivelData>,
    modelData: any[],
  ): void => {
    modelData.forEach((row) => {
      const key = `${row.Pavimento}-${row.Unidade}`;
      const refData = map[key];
  
      if (refData) {
        // Use calculateDeltas for PHFT
        const deltaPHFT = calculateDeltas(row['PHFT_Avg'], refData.PHFT_Min);
        refData['Delta PHFT'] = deltaPHFT;
  
        // Use calculateDeltas for RedCgTT
        const redCgTTReal = row['CargaTermica_Sum'] || null;
        const redCgTTRef = refData['RedCgTT'] || null;
        const deltaRedCgTT =
          redCgTTReal !== null && redCgTTRef !== null
            ? Math.ceil((1 - redCgTTReal / redCgTTRef) * 100 * 100) / 100
            : null;
        refData['RedCgTT'] = deltaRedCgTT;
      }
    });
  };
  
  const evaluateNivelStatus = (map: Record<string, NivelData>): void => {
    Object.values(map).forEach((item) => {
      const phftConditionMet =
        item['Delta PHFT'] !== null && item['Delta PHFT'] > (item.PHFT_Min || 0);
      const redCgTTConditionMet =
        item['RedCgTT'] !== null && item['RedCgTT'] > (item.RedCgTTmin || 0);
  
      item.Status =
        phftConditionMet && redCgTTConditionMet ? 'ATENDIDO' : 'NÃO ATENDIDO';
    });
  };
  

  const createNivelIntermediarioData = (
    summaryData: any[],
    summaryModelRealData: any[],
  ): NivelData[] => {
    const nivelIntermediarioMap = initializeNivelData(summaryData, 'PHFT_Min');
    updateNivelData(nivelIntermediarioMap, summaryModelRealData);
    evaluateNivelStatus(nivelIntermediarioMap);
    return Object.values(nivelIntermediarioMap);
  };

  const createNivelSuperiorData = (
    summaryData: any[],
    summaryModelRealData: any[],
  ): NivelData[] => {
    const nivelSuperiorMap = initializeNivelData(summaryData, 'PHFT_Min_Sup');
    updateNivelData(nivelSuperiorMap, summaryModelRealData);
    evaluateNivelStatus(nivelSuperiorMap);
    return Object.values(nivelSuperiorMap);
  };
  interface ModelRow {
    Pavimento: string;
    Unidade: string;
    Nome: string;
    [key: string]: any; // Permite propriedades adicionais com string como chave
  }

  // Estados para progresso
  const [progress, setProgress] = useState<string>(''); // Adicionado estado para progresso


  // Função principal para gerar o arquivo de saída
  const generateOutputFile = async () => {
    let areaColumnExists = false;


    type CleanOutputRow = {
      Pavimento: string;
      Unidade: string;
      Código: string;
      Nome: string;
      ['Tipo de ambiente']: string;
      Area?: number;
      ['MIN TEMP']: number;
      ['MAX TEMP']: number;
      ['NHFT']?: number;
      ['PHFT']?: number;
      ['CARGA RESF']?: number;
      ['CARGA AQUE']?: number;
      ['CARGA TERM']?: number;
    };

    // Função para processar os dados em chunks
    const processChunks = async (
      modelData: any[],
      vnData: any[],
      selectedInterval: number,
      includeCargaTermica: boolean,
      additionalFile: File | null,
      areaColumnExists: boolean,
      chunkSize: number = 1000
    ) => {
      const totalRows = modelData.length;
      let processedRows = 0;
      
      // Função para processar um chunk
      const processChunk = async (chunk: any[]) => {
        const chunkResults = await Promise.all(chunk.map((row) => 
          processModelRow(
            row,
            vnData,
            selectedInterval,
            includeCargaTermica,
            additionalFile,
            areaColumnExists
          )
        ));
        
        // Filtrar valores nulos
        return chunkResults.filter((item): item is NonNullable<typeof item> => Boolean(item));
      };

      const chunks = [];
      for (let i = 0; i < totalRows; i += chunkSize) {
        chunks.push(modelData.slice(i, i + chunkSize));
      }

      // Processar cada chunk
      const allProcessedRows: CleanOutputRow[] = [];
      for (const chunk of chunks) {
        const chunkData = await processChunk(chunk);
        allProcessedRows.push(...chunkData);

        processedRows += chunkData.length;
        setProgress(`Processando ${processedRows} de ${totalRows}...`); // Atualizar progresso
      }

      return allProcessedRows;
    };

    const handleProcess = async () => {
      if (!selectedVNFile || !selectedModelFile || (includeModeloReal && !selectedVNFile2)) {
        console.error('Arquivos necessários não foram selecionados.');
        return;
      }
      setIsLoading(true);
      try {
        const [vnData, modelData, vnData2] = await Promise.all([
          parseFile(selectedVNFile),
          parseModelExcel(selectedModelFile),
          includeModeloReal && selectedVNFile2 ? parseFile(selectedVNFile2) : Promise.resolve(null),
        ]);
        // Processar em chunks
        const cleanOutputData = await processChunks(
          modelData,
          vnData,
          selectedInterval,
          includeCargaTermica,
          additionalFile,
          areaColumnExists
        );
    
        const summaryData = createSummaryData(cleanOutputData);
    
        const sheets: { [sheetName: string]: any[] } = {
          Output: cleanOutputData,
          Summary: summaryData.map(({ Pavimento, Unidade, MinTemp, MaxTemp, PHFT_Avg, CargaTermica_Sum }) => ({
            Pavimento,
            Unidade,
            MinTemp,
            MaxTemp,
            PHFT_Avg,
            CargaTermica_Sum,
          })),
        };
    
        // Processar modelo real, se necessário
        if (includeModeloReal && vnData2) {
          const outputModelRealData = await processChunks(
            modelData,
            vnData2,
            selectedInterval,
            includeCargaTermica,
            additionalFile,
            areaColumnExists
          );
          
          const cleanOutputModelRealData: CleanOutputRow[] = outputModelRealData
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => ({
              Pavimento: item.Pavimento,
              Unidade: item.Unidade,
              Código: item.Código,
              Nome: item.Nome,
              "Tipo de ambiente": item['Tipo de ambiente'],
              Area: typeof item.Area === 'number' ? item.Area : undefined,
              "MIN TEMP": item['MIN TEMP'],
              "MAX TEMP": item['MAX TEMP'],
              NHFT: item.NHFT,
              PHFT: item.PHFT,
              "CARGA RESF": item['CARGA RESF'],
              "CARGA AQUE": item['CARGA AQUE'],
              "CARGA TERM": item['CARGA TERM'],
              
            }));
    
          const summaryModelRealData = createSummaryData(cleanOutputModelRealData);
    
          sheets['Modelo Real Output'] = cleanOutputModelRealData;
          sheets['Modelo Real Summary'] = summaryModelRealData;
          sheets['Análise de Nível Mínimo'] = createNivelMinimoData(summaryData, summaryModelRealData);
    
          if (includeCargaTermica) {
            sheets['Análise de Nível Intermediario'] = createNivelIntermediarioData(summaryData, summaryModelRealData);
            sheets['Análise de Nível Superior'] = createNivelSuperiorData(summaryData, summaryModelRealData);
          }
        }
    
        const workbookArrayBuffer = await generateWorkbook(sheets);
        setOutputFile(new Blob([workbookArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        console.log('Arquivo Excel gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao processar os arquivos:', error);
      } finally {
        setIsLoading(false);
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
            onDrop={(files) => handleFileDrop(files, 'VN')}
            acceptMultipleFileTypes={true}
            selectedFile={selectedVNFile}
            onDelete={() => handleDeleteFile('VN')}
          />
          {/* Dropzone do VN Modelo Real, se estiver ativado */}
          {includeModeloReal && (
            <FileDropZone
              label="Arquivo de VN do Modelo Real"
              onDrop={(files) => handleFileDrop(files, 'VN2')}
              acceptMultipleFileTypes={true}
              selectedFile={selectedVNFile2}
              onDelete={() => handleDeleteFile('VN2')}
            />
          )}
        </div>

        {/* Centralizar o dropzone do Modelo REF abaixo dos dois anteriores */}
        <FileDropZone
          label="Arquivo de Modelo do Modelo REF"
          onDrop={(files) => handleFileDrop(files, 'Model')}
          selectedFile={selectedModelFile}
          onDelete={() => handleDeleteFile('Model')}
        />

        {/* Condicional para Carga Térmica */}
        {includeCargaTermica && (
          <div style={{ display: 'flex', gap: '40px' }}>
            <FileDropZone
              label="Arquivo de Carga Térmica do Modelo REF"
              onDrop={(files) => handleFileDrop(files, 'Carga1')}
              acceptMultipleFileTypes={true}
              selectedFile={additionalFile}
              onDelete={() => handleDeleteFile('Carga1')}
            />
            {includeModeloReal && (
              <FileDropZone
                label="Arquivo de Carga Térmica do Modelo Real"
                onDrop={(files) => handleFileDrop(files, 'Carga2')}
                acceptMultipleFileTypes={true}
                selectedFile={additionalFile2}
                onDelete={() => handleDeleteFile('Carga2')}
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
      <h2>{progress}</h2>
      <FileActions
        onGenerate={generateOutputFile}
        canGenerate={canGenerate}
        outputFile={outputFile}
        isLoading={isLoading}
        progress = {progress}
        notifyError={notifyError}
      />
    </div>
  );
};

export default FileUpload;
