import React from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';
import './FileUpload.css';

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  selectedFile: File | null;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  acceptMultipleFileTypes?: boolean; // Adicionar a opção de aceitar múltiplos tipos de arquivo
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onDrop,
  selectedFile,
  onDelete,
  label,
  acceptMultipleFileTypes = false, // Definir como falso por padrão
}) => {
  // Define tipos de arquivos aceitos
  const accept: Record<string, string[]> = acceptMultipleFileTypes
    ? {
        'text/csv': [],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      }
    : {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        width: '300px',
        position: 'relative',
        marginTop: '20px',
      }}
    >
      <input {...getInputProps()} />
      {label && <p>{label}</p>} {/* Exibe o label, se fornecido */}
      {selectedFile ? (
        <div style={{ position: 'relative' }}>
          {selectedFile.type === 'text/csv' ? (
            <FaFileCsv size={48} />
          ) : (
            <FaFileExcel size={48} />
          )}
          <p>{selectedFile.name}</p>
          <button
            onClick={onDelete}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: '#ff4d4d',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '16px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#ff3333')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#ff4d4d')
            }
          >
            <FaTimes />
          </button>
        </div>
      ) : (
        <p>
          Drag & drop a {acceptMultipleFileTypes ? 'CSV or Excel' : 'Excel'}{' '}
          file here, or click to select
        </p>
      )}
    </div>
  );
};

export default FileDropZone;
