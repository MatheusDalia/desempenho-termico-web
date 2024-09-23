import React from 'react';

interface FileActionsProps {
  onGenerate: () => void;
  canGenerate: boolean;
  outputFile: Blob | null;
  isLoading: boolean;
}

const FileActions: React.FC<FileActionsProps> = ({
  onGenerate,
  canGenerate,
  outputFile,
  isLoading,
}) => {
  console.log('Output File:', outputFile); // Log the outputFile value

  return (
    <div style={{ marginTop: '20px' }}>
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Generate and Download Output File
      </button>
      {outputFile && (
        <a
          href={URL.createObjectURL(outputFile)}
          download="output.xlsx"
          style={{
            marginTop: '10px',
            textDecoration: 'none',
            color: '#007bff',
          }}
        >
          Download Generated File
        </a>
      )}
      {isLoading && <div className="spinner"></div>}
    </div>
  );
};

export default FileActions;
