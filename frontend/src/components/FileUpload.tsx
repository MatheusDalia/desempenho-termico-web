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
import { toast, Slide, ToastContainer, ToastPosition } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [includeCargaTermica, setIncludeCargaTermica] =
    useState<boolean>(false);
  const [includeModeloReal, setIncludeModeloReal] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [selectedVNFile2, setSelectedVNFile2] = useState<File | null>(null);
  const [selectedModelFile2, setSelectedModelFile2] = useState<File | null>(
    null,
  );
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [additionalFile2, setAdditionalFile2] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<any[]>([]);

  const [selectedInterval, setSelectedInterval] = useState<number>(26);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initialize as false

  // Função para exibir toasts de erro detalhado
  const notifyError = (message: string) => {
    toast.error(`Erro: ${message}`);
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
    if (
      (selectedVNFile && selectedModelFile && !includeModeloReal) ||
      (selectedVNFile && selectedModelFile && selectedVNFile2 && selectedModelFile2 && includeModeloReal)
    ) {
      setIsLoading(true);
      try {
        console.log("Processing VN file...");
        
        // Processar arquivo VN
        const vnData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(selectedVNFile, {
            header: true,
            complete: (results: Papa.ParseResult<any>) => {
              console.log("VN file processed:", results.data);
              resolve(results.data);
            },
            error: (error: any) => {
              notifyError(`Falha ao processar o arquivo CSV VN: ${error.message}`);
              reject(error);
            },
          });
        });

        console.log("Processing Model file...");
        
        // Processar arquivo Model Excel
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const modelData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(worksheet);
            console.log("Model file processed:", modelData);
            
            const outputData = await Promise.all(
              modelData.map(async (modelRow) => {
                const codigo = modelRow['Código'];
                const tipoAmbiente = modelRow['Tipo de ambiente'];

                if (!codigo || !tipoAmbiente) {
                  notifyError('Linha ignorada: Código ou Tipo de ambiente ausente.');
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
                        error: (error: any) => {
                          notifyError(`Falha ao processar o arquivo de Carga Térmica: ${error.message}`);
                          reject(error);
                        },
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
                    notifyError('Erro ao calcular a Carga Térmica.');
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
              })
            );

            // Remover entradas nulas
            const cleanOutputData = outputData.filter((row) => row !== null);
            console.log("Clean output data:", cleanOutputData);
            setOutputFile(cleanOutputData)

            // Criar planilhas e salvar o arquivo de saída (omiti por brevidade)

          } catch (error) {
            if (error instanceof Error) {
              notifyError(`Error: ${error.message}`);
            } else {
              toast.error('An unknown error occurred.');
            }
          }
        };
        reader.readAsArrayBuffer(selectedModelFile);
      } catch (error) {
        if (error instanceof Error) {
          notifyError(`Error: ${error.message}`);
        } else {
          toast.error('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      notifyError('Selecione os arquivos necessários antes de gerar o relatório.');
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
      <ToastContainer />
      <h1 style={{ marginBottom: '20px' }}>Análise Térmica</h1>

      <div style={{ marginTop: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={includeModeloReal}
            onChange={() => setIncludeModeloReal(!includeModeloReal)}
          />
          Incluir Modelo Real
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
          marginTop: '20px',
        }}
      >
        {/* Coluna original (dropzones empilhados) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FileDropZone
            label="Arquivo de VN do Modelo Normal"
            onDrop={handleDropVN}
            acceptMultipleFileTypes={true}
            selectedFile={selectedVNFile}
            onDelete={handleDeleteVNFile}
          />
          <FileDropZone
            label="Arquivo de Modelo do Modelo Normal"
            onDrop={handleDropModel}
            selectedFile={selectedModelFile}
            onDelete={handleDeleteModelFile}
          />
          {includeCargaTermica && (
            <FileDropZone
              label="Arquivo de Carga Térmica do Modelo Normal"
              onDrop={handleDropCargaTermica}
              selectedFile={additionalFile}
              onDelete={handleDeleteAdditionalFile}
            />
          )}
        </div>

        {/* Coluna do modelo real (dropzones empilhados) */}
        {includeModeloReal && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <FileDropZone
              label="Arquivo de VN do Modelo Real"
              onDrop={handleDropVN2}
              acceptMultipleFileTypes={true}
              selectedFile={selectedVNFile2}
              onDelete={handleDeleteVNFile2}
            />
            <FileDropZone
              label="Arquivo de Modelo do Modelo Real"
              onDrop={handleDropModel2}
              selectedFile={selectedModelFile2}
              onDelete={handleDeleteModelFile2}
            />
            {includeCargaTermica && (
              <FileDropZone
                label="Arquivo de Carga Térmica do Modelo Real"
                onDrop={handleDropCargaTermica2}
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
        canGenerate={!!selectedVNFile && !!selectedModelFile}
        outputFile={outputFile}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FileUpload;
