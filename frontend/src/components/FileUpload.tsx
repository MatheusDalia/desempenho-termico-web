import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
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
import JSZip from 'jszip';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [includeCargaTermica, setIncludeCargaTermica] =
    useState<boolean>(false);
  const [includeModeloReal, setIncludeModeloReal] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [selectedVNFile2, setSelectedVNFile2] = useState<File | null>(null);
  const [selectedModelFile2, setSelectedModelFile2] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [additionalFile2, setAdditionalFile2] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<Blob | null>(null);
 
  const [selectedInterval, setSelectedInterval] = useState<number>(26);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initialize as false

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

  const handleDeleteModelFile2 = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the input from opening
    setSelectedModelFile2(null);
    dispatch(setModelFile(null));
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
        if (fileType === 'csv') {
          setSelectedVNFile(file);
          dispatch(setFile(file));
          processCsvFile(file);
        } else if (fileType === 'xlsx') {
          setSelectedModelFile(file);
          dispatch(setModelFile(file));
          processExcelFile(file);
        }
      }
    },
    [dispatch],
  );

  const handleDrop2 = useCallback(
    (acceptedFiles: File[], fileType: string) => {
      const file = acceptedFiles[0];
      if (file) {
        if (fileType === 'csv') {
          setSelectedVNFile2(file);
          dispatch(setFile(file));
          processCsvFile(file);
        } else if (fileType === 'xlsx') {
          setSelectedModelFile2(file);
          dispatch(setModelFile(file));
          processExcelFile(file);
        }
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

  const handleDropModel2 = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleDrop2(acceptedFiles, 'xlsx');
      }
    },
    [handleDrop2],
  );

  const handleDropCargaTermica2 = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAdditionalFile2(acceptedFiles[0]);
    }
  }, []);


  const { getRootProps: getRootPropsModel, getInputProps: getInputPropsModel } =
    useDropzone({
      onDrop: handleDropModel,
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx',
        ],
      },
    });

    useDropzone({
    onDrop: handleDropModel2,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
  });

  const { getRootProps: getRootPropsVN, getInputProps: getInputPropsVN } =
    useDropzone({
      onDrop: handleDropVN,
      accept: {
        'text/csv': ['.csv'],
      },
    });

  const {
    getRootProps: getRootPropsCargaTermica,
    getInputProps: getInputPropsCargaTermica,
  } = useDropzone({
    onDrop: handleDropCargaTermica,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'text/csv': ['.csv'],
    },
  });

  const {
    getRootProps: getRootPropsModel2,
    getInputProps: getInputPropsModel2,
  } = useDropzone({
    onDrop: handleDropModel2,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
  });

  const generateOutputFile = async () => {
    if ((selectedVNFile && selectedModelFile && !includeModeloReal) || (selectedVNFile && selectedModelFile && selectedVNFile2 && selectedModelFile2 && includeModeloReal)) {
      setIsLoading(true); // Inicia o spinner de carregamento
      try {
        // Processar arquivo VN
        const vnData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(selectedVNFile, {
            header: true,
            complete: (results: Papa.ParseResult<any>) => resolve(results.data),
            error: (error: any) => reject(error),
          });
        });
  
        // Processar arquivo Model Excel
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const modelData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(worksheet);
  
            const outputData = await Promise.all(modelData.map(async (modelRow) => {
              const codigo = modelRow['Código'];
              const tipoAmbiente = modelRow['Tipo de ambiente'];
  
              if (!codigo || !tipoAmbiente) {
                console.warn('Skipping row due to missing Código or Tipo de ambiente:', modelRow);
                return null;
              }
  
              const filteredData = filterData(vnData, tipoAmbiente);
              const minTemp = getMinTemperature(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`);
              const maxTemp = getMaxTemperature(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`);
              const numericSelectedInterval = selectedInterval;
              const nhftValue = getNhftValue(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`, numericSelectedInterval);
              let phftValue = 0;
  
              if (tipoAmbiente === 'Quarto') {
                phftValue = (nhftValue / 3650) * 100;
              } else if (tipoAmbiente === 'Misto') {
                phftValue = (nhftValue / 6570) * 100;
              } else {
                phftValue = (nhftValue / 2920) * 100;
              }
  
              let carga = 0;
              let cargaResfrValue = 0;
  
              if (includeCargaTermica && additionalFile) {
                try {
                  const cargaData = await new Promise<any[]>((resolve, reject) => {
                    Papa.parse(additionalFile, {
                      header: true,
                      complete: (results: Papa.ParseResult<any>) => resolve(results.data),
                      error: (error: any) => reject(error),
                    });
                  });
  
                  const cargaFilteredData = filterData(cargaData, tipoAmbiente);
                  const cargaTermicaResult = cargaTerm({
                    cargaFilteredData,
                    filteredData,
                    codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
                    codigoSolo: codigo,
                    thresholdVar: numericSelectedInterval,
                  });
                  cargaResfrValue = calculateCargaResfr(cargaFilteredData, codigo, 26);
                  carga = cargaTermicaResult;
                } catch (error) {
                  console.error('Erro ao processar arquivo de Carga Térmica:', error);
                }
              }
  
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
            }));
  
            // Remover entradas nulas
            const cleanOutputData = outputData.filter((row) => row !== null);
  
            // Criar dados de resumo
            const summaryData: any[] = [];
            const summaryMap: { [key: string]: any } = {};
  
            cleanOutputData.forEach((row) => {
              if (row) {
                const key = `${row.Pavimento}_${row.Unidade}`;
                if (!summaryMap[key]) {
                  summaryMap[key] = {
                    Pavimento: row.Pavimento,
                    Unidade: row.Unidade,
                    MinTemp: row['MIN TEMP'],
                    MaxTemp: row['MAX TEMP'],
                    PHFT_Sum: row.PHFT || 0,
                    CargaTermica_Sum: row['CARGA TERM'] || 0,
                    Count: 1,
                  };
                } else {
                  summaryMap[key].MinTemp = Math.min(summaryMap[key].MinTemp, row['MIN TEMP']);
                  summaryMap[key].MaxTemp = Math.max(summaryMap[key].MaxTemp, row['MAX TEMP']);
                  summaryMap[key].PHFT_Sum += row.PHFT || 0;
                  summaryMap[key].CargaTermica_Sum += row['CARGA TERM'] || 0;
                  summaryMap[key].Count += 1;
                }
              }
            });
  
            for (const key in summaryMap) {
              const entry = summaryMap[key];
              summaryData.push({
                Pavimento: entry.Pavimento,
                Unidade: entry.Unidade,
                MinTemp: entry.MinTemp,
                MaxTemp: entry.MaxTemp,
                PHFT_Avg: entry.PHFT_Sum / entry.Count,
                CargaTermica_Sum: entry.CargaTermica_Sum,
              });
            }
  
            // Criar planilhas para os dados de saída e resumo
            const outputWorksheet = XLSX.utils.json_to_sheet(cleanOutputData);
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  
            // Criar uma nova planilha e adicionar ambas as abas
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, outputWorksheet, 'Output');
            XLSX.utils.book_append_sheet(newWorkbook, summaryWorksheet, 'Summary');
  
            // Escrever a planilha em um array
            const output = XLSX.write(newWorkbook, { type: 'array' });
  
            // Definir o arquivo gerado para o estado outputFile
            setOutputFile(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  
            // Processar arquivo Modelo Real, se selecionado
            if (includeModeloReal && selectedVNFile2) {
              const modelRealReader = new FileReader();
              const vnData2 = await new Promise<any[]>((resolve, reject) => {
                Papa.parse(selectedVNFile2, {
                  header: true,
                  complete: (results: Papa.ParseResult<any>) => resolve(results.data),
                  error: (error: any) => reject(error),
                });
              });
              modelRealReader.onload = async (e) => {
                try {
                  const data = new Uint8Array(e.target?.result as ArrayBuffer);
                  const modelRealWorkbook = XLSX.read(data, { type: 'array' });
                  const modelRealWorksheet = modelRealWorkbook.Sheets[modelRealWorkbook.SheetNames[0]];
                  const modelRealData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(modelRealWorksheet);
  
                  const outputModelRealData = await Promise.all(modelRealData.map(async (modelRow) => {
                    const codigo = modelRow['Código'];
                    const tipoAmbiente = modelRow['Tipo de ambiente'];
  
                    if (!codigo || !tipoAmbiente) {
                      console.warn('Skipping row due to missing Código or Tipo de ambiente:', modelRow);
                      return null;
                    }
  
                    const filteredData = filterData(vnData2, tipoAmbiente);
                    const minTemp = getMinTemperature(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`);
                    const maxTemp = getMaxTemperature(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`);
                    const numericSelectedInterval = selectedInterval;
                    const nhftValue = getNhftValue(filteredData, `${codigo}:Zone Operative Temperature [C](Hourly)`, numericSelectedInterval);
                    let phftValue = 0;
  
                    if (tipoAmbiente === 'Quarto') {
                      phftValue = (nhftValue / 3650) * 100;
                    } else if (tipoAmbiente === 'Misto') {
                      phftValue = (nhftValue / 6570) * 100;
                    } else {
                      phftValue = (nhftValue / 2920) * 100;
                    }
  
                    let carga = 0;
                    let cargaResfrValue = 0;
  
                    if (includeCargaTermica && additionalFile2) {
                      try {
                        const cargaData2 = await new Promise<any[]>((resolve, reject) => {
                          Papa.parse(additionalFile2, {
                            header: true,
                            complete: (results: Papa.ParseResult<any>) => resolve(results.data),
                            error: (error: any) => reject(error),
                          });
                        });
  
                        const cargaFilteredData2 = filterData(cargaData2, tipoAmbiente);
                        const cargaTermicaResult = cargaTerm({
                          cargaFilteredData: cargaFilteredData2,
                          filteredData,
                          codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
                          codigoSolo: codigo,
                          thresholdVar: numericSelectedInterval,
                        });
                        cargaResfrValue = calculateCargaResfr(cargaFilteredData2, codigo, 26);
                        carga = cargaTermicaResult;
                      } catch (error) {
                        console.error('Erro ao processar arquivo de Carga Térmica:', error);
                      }
                    }
  
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
                  }));
  
                  // Remover entradas nulas
                  const cleanOutputModelRealData = outputModelRealData.filter((row) => row !== null);
  
                  // Criar dados de resumo
                  const summaryModelRealData: any[] = [];
                  const summaryModelRealMap: { [key: string]: any } = {};
  
                  cleanOutputModelRealData.forEach((row) => {
                    if (row) {
                      const key = `${row.Pavimento}_${row.Unidade}`;
                      if (!summaryModelRealMap[key]) {
                        summaryModelRealMap[key] = {
                          Pavimento: row.Pavimento,
                          Unidade: row.Unidade,
                          MinTemp: row['MIN TEMP'],
                          MaxTemp: row['MAX TEMP'],
                          PHFT_Sum: row.PHFT || 0,
                          CargaTermica_Sum: row['CARGA TERM'] || 0,
                          Count: 1,
                        };
                      } else {
                        summaryModelRealMap[key].MinTemp = Math.min(summaryModelRealMap[key].MinTemp, row['MIN TEMP']);
                        summaryModelRealMap[key].MaxTemp = Math.max(summaryModelRealMap[key].MaxTemp, row['MAX TEMP']);
                        summaryModelRealMap[key].PHFT_Sum += row.PHFT || 0;
                        summaryModelRealMap[key].CargaTermica_Sum += row['CARGA TERM'] || 0;
                        summaryModelRealMap[key].Count += 1;
                      }
                    }
                  });
  
                  for (const key in summaryModelRealMap) {
                    const entry = summaryModelRealMap[key];
                    summaryModelRealData.push({
                      Pavimento: entry.Pavimento,
                      Unidade: entry.Unidade,
                      MinTemp: entry.MinTemp,
                      MaxTemp: entry.MaxTemp,
                      PHFT_Avg: entry.PHFT_Sum / entry.Count,
                      CargaTermica_Sum: entry.CargaTermica_Sum,
                    });
                  }
  
                  // Criar planilhas para os dados de saída e resumo
                  const outputModelRealWorksheet = XLSX.utils.json_to_sheet(cleanOutputModelRealData);
                  const summaryModelRealWorksheet = XLSX.utils.json_to_sheet(summaryModelRealData);
  
                  // Adicionar abas à planilha existente
                  XLSX.utils.book_append_sheet(newWorkbook, outputModelRealWorksheet, 'Output_Model_Real');
                  XLSX.utils.book_append_sheet(newWorkbook, summaryModelRealWorksheet, 'Summary_Model_Real');
  
                  // Escrever a planilha em um array
                  const outputModelReal = XLSX.write(newWorkbook, { type: 'array' });
  
                  // Definir o arquivo gerado para o estado outputFile
                  setOutputFile(new Blob([outputModelReal], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  
                } catch (error) {
                  console.error('Erro ao processar arquivo Modelo Real:', error);
                } finally {
                  setIsLoading(false); // Finaliza o spinner de carregamento
                }
              };
  
              if (selectedModelFile2) {
                modelRealReader.readAsArrayBuffer(selectedModelFile2);
              }
            } else {
              setIsLoading(false); // Finaliza o spinner de carregamento
            }
  
          } catch (error) {
            console.error('Erro ao processar arquivo Model Excel:', error);
            setIsLoading(false); // Finaliza o spinner de carregamento
          }
        };
  
        reader.readAsArrayBuffer(selectedModelFile);
      } catch (error) {
        console.error('Erro ao processar arquivos VN:', error);
        setIsLoading(false); // Finaliza o spinner de carregamento
      }
    } else {
      console.warn('Arquivos necessários não selecionados.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <h1 style={{ marginBottom: '20px' }}>Análise Térmica</h1>
      <FileDropZone
        onDrop={handleDropVN}
        fileType='csv'
        selectedFile={selectedVNFile}
        onDelete={handleDeleteVNFile}
      />
      <FileDropZone
        onDrop={handleDropModel}
        fileType='xlsx'
        selectedFile={selectedModelFile}
        onDelete={handleDeleteModelFile}
      />
      <div style={{ marginTop: '20px' }}>
        <label>
          Interval:
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(Number(e.target.value))}
          >
            <option value="26">Intervalo 1 - 18,0 °C &lt; ToAPPa &lt; 26,0 °C</option>
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
      {includeCargaTermica && (
        <FileDropZone
          onDrop={handleDropCargaTermica}
          fileType='csv'
          selectedFile={additionalFile}
          onDelete={handleDeleteAdditionalFile}
        />
      )}
      <div style={{ marginTop: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={includeModeloReal}
            onChange={() => setIncludeModeloReal(!includeModeloReal)}
          />
          Incluir Modelo Real
        </label>
        {includeModeloReal && (
          <>
            <FileDropZone
              onDrop={handleDropVN2}
              fileType='csv'
              selectedFile={selectedVNFile2}
              onDelete={handleDeleteVNFile2}
            />
            <FileDropZone
              onDrop={handleDropModel2}
              fileType='xlsx'
              selectedFile={selectedModelFile2}
              onDelete={handleDeleteModelFile2}
            />
            {includeCargaTermica && (
              <FileDropZone
                onDrop={handleDropCargaTermica2}
                fileType='csv'
                selectedFile={additionalFile2}
                onDelete={handleDeleteAdditionalFile2}
              />
            )}
          </>
        )}
      </div>
      <FileActions
        onGenerate={generateOutputFile}
        canGenerate={!!selectedVNFile && !!selectedModelFile}
        outputFile={outputFile}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FileUpload;
