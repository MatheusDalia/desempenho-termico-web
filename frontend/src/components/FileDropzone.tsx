import React from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';
import './FileUpload.css';

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  fileType: 'csv' | 'xlsx';
  selectedFile: File | null;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onDrop,
  fileType,
  selectedFile,
  onDelete,
}) => {
  // Define accepted file types based on fileType prop
  const accept: Accept = fileType === 'csv'
    ? { 'text/csv': [] }
    : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [] };

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
        marginTop: fileType === 'csv' ? '0' : '20px',
      }}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <div style={{ position: 'relative' }}>
          {fileType === 'csv' ? <FaFileCsv size={48} /> : <FaFileExcel size={48} />}
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
        <p>Drag & drop a {fileType === 'csv' ? 'VN CSV' : 'Model Excel'} file here, or click to select</p>
      )}
    </div>
  );
};

export default FileDropZone;

