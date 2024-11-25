import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import './FileUpload.css';
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

  // Atualiza a condição para habilitar a geração de arquivos
  useEffect(() => {
    setCanGenerate(
      !!selectedVNFile &&
        !!selectedModelFile &&
        (!includeCargaTermica || !!additionalFile) &&
        (!includeModeloReal || !!selectedVNFile2),
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

  // Função principal para gerar o arquivo de saída
  const generateOutputFile = async () => {
    if (!selectedVNFile || !selectedModelFile) {
      notifyError('Arquivos necessários não foram selecionados.');
      return;
    }

    setIsLoading(true);

    // Create a new Web Worker
    const worker = new Worker(
      new URL('../workers/fileProcessingWorker.ts', import.meta.url),
    );

    // Prepare input data for worker
    const workerInput = {
      selectedVNFile,
      selectedModelFile,
      selectedInterval,
      includeCargaTermica,
      includeModeloReal,
      additionalFile,
      selectedVNFile2,
      additionalFile2,
    };

    // Send data to worker
    worker.postMessage(workerInput);

    // Handle worker responses
    worker.onmessage = (event) => {
      if (event.data.type === 'complete') {
        const workbookArrayBuffer = event.data.workbook;

        setOutputFile(
          new Blob([workbookArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );

        console.log('Arquivo Excel gerado com sucesso!');
      } else if (event.data.type === 'error') {
        console.error('Erro ao processar os arquivos:', event.data.error);
        notifyError('Falha no processamento dos arquivos');
      }

      // Always stop loading and terminate worker
      setIsLoading(false);
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      notifyError('Erro interno no processamento');
      setIsLoading(false);
      worker.terminate();
    };
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
