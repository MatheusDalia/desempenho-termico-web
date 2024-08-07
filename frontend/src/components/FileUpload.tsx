import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setComparisonFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [interval, setInterval] = useState<string>('');
  const [includeCargaTermica, setIncludeCargaTermica] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], type: 'vn' | 'csv') => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Upload response:', response);

        if (type === 'vn') {
          setSelectedFile(file);
          dispatch(setFile(file));
        } else if (type === 'csv') {
          setSelectedFile(file);
          dispatch(setComparisonFile(file));
        }
        setError(null);
      } catch (error: unknown) {
        console.error('Error uploading file:', error);
        let errorMessage = 'Error uploading file';
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
        }
        setError(errorMessage);
      }
    }
  }, [dispatch]);

  const handleDropVN = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles, 'vn');
    }
  }, [onDrop]);

  const handleDropCSV = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles, 'csv');
    }
  }, [onDrop]);

  const { getRootProps: getRootPropsVN, getInputProps: getInputPropsVN } = useDropzone({
    onDrop: handleDropVN,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const { getRootProps: getRootPropsCargaTermica, getInputProps: getInputPropsCargaTermica } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setAdditionalFile(acceptedFiles[0]);
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        try {
          const response = await axios.post('/api/upload-additional', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Additional file upload response:', response);
          setError(null);
        } catch (error: unknown) {
          console.error('Error uploading additional file:', error);
          let errorMessage = 'Error uploading additional file';
          if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
          }
          setError(errorMessage);
        }
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Análise Térmica</h1>

      <div
        {...getRootPropsVN()}
        style={{
          border: '2px dashed #cccccc',
          padding: '40px',
          textAlign: 'center',
          width: '300px',
          height: '300px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
          position: 'relative',
          margin: '10px',
        }}
      >
        <input {...getInputPropsVN()} />
        {selectedFile && selectedFile.name.includes('VN') ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ fontSize: '48px', color: '#333' }}>
              {selectedFile.type.includes('csv') ? <FaFileCsv /> : <FaFileExcel />}
            </div>
            <button onClick={() => setSelectedFile(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', color: '#333' }}>
              <FaTimes />
            </button>
          </div>
        ) : (
          <p>Drag & drop VN file here, or click to select one</p>
        )}
      </div>

      {includeCargaTermica && (
        <div
          {...getRootPropsCargaTermica()}
          style={{
            border: '2px dashed #cccccc',
            padding: '40px',
            textAlign: 'center',
            width: '300px',
            height: '300px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
            position: 'relative',
            margin: '10px',
          }}
        >
          <input {...getInputPropsCargaTermica()} />
          {additionalFile ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ fontSize: '48px', color: '#333' }}>
                {additionalFile.type.includes('csv') ? <FaFileCsv /> : <FaFileExcel />}
              </div>
              <button onClick={() => setAdditionalFile(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', color: '#333' }}>
                <FaTimes />
              </button>
            </div>
          ) : (
            <p>Drag & drop Carga Térmica file here, or click to select one</p>
          )}
        </div>
      )}

      <div style={{ margin: '20px' }}>
        <button onClick={() => {
          if (selectedFile) {
            window.location.href = '/api/download';
          }
        }}>Download Excel File</button>
      </div>

      <div style={{ margin: '20px' }}>
        <label>
          Intervalo:
          <select value={interval} onChange={(e) => setInterval(e.target.value)}>
            <option value="">Select Interval</option>
            <option value="intervalo1">Intervalo 1 - 18,0 °C &lt; ToAPPa &lt; 26,0 °C</option>
            <option value="intervalo2">Intervalo 2 - ToAPP &lt; 28,0 °C</option>
            <option value="intervalo3">Intervalo 3 - ToAPP &lt; 30,0 °C</option>
          </select>
        </label>
      </div>

      <div style={{ margin: '20px' }}>
        <label>
          Inclui Carga Térmica:
          <input
            type="checkbox"
            checked={includeCargaTermica}
            onChange={() => setIncludeCargaTermica(!includeCargaTermica)}
          />
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default FileUpload;
