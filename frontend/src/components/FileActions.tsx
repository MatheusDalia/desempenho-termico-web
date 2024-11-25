import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';

interface FileActionsProps {
  onGenerate: () => void;
  canGenerate: boolean;
  outputFile: Blob | null;
  isLoading: boolean;
  notifyError: (title: string, message: string) => void; // Add this prop
}

const FileActions: React.FC<FileActionsProps> = ({
  onGenerate,
  canGenerate,
  outputFile,
  isLoading,
  notifyError,
}) => {
  const handleGenerateClick = () => {
    if (!canGenerate) {
      notifyError(
        'Arquivos Não Selecionados',
        'Por favor, selecione os arquivos necessários.',
      );
      return;
    }
    onGenerate();
  };

  // Log when the output file is generated
  useEffect(() => {
    if (outputFile) {
      console.log('Output file generated:', outputFile);
    }
  }, [outputFile]);

  return (
    <div
      style={{
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <button
        onClick={handleGenerateClick}
        disabled={!canGenerate}
        style={{
          padding: '10px 20px',
          backgroundColor: canGenerate ? '#4CAF50' : '#ccc',
          color: '#fff',
          border: 'none',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          marginBottom: '10px',
          opacity: canGenerate ? 1 : 0.6,
        }}
      >
        Generate and Download Output File
      </button>
      {!canGenerate && (
        <p style={{ color: 'red' }}>
          Por favor, selecione os arquivos necessários para habilitar a geração
          do arquivo.
        </p>
      )}
      {outputFile && (
        <a
          href={URL.createObjectURL(outputFile)}
          download="output.xlsx"
          style={{
            textDecoration: 'none',
            color: '#007bff',
            marginBottom: '10px',
          }}
        >
          Download Generated File
        </a>
      )}
    </div>
  );
};

export default FileActions;
