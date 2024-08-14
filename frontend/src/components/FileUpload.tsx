import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [interval, setInterval] = useState<string>(''); // Declare state with initial value
  const [includeCargaTermica, setIncludeCargaTermica] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);

  const handleDrop = useCallback((acceptedFiles: File[], fileType: string) => {
    const file = acceptedFiles[0];
    if (file) {
      console.log(`File dropped: ${file.name}, Type: ${fileType}`);
      if (fileType === 'csv') {
        setSelectedVNFile(file);
        dispatch(setFile(file));
      } else if (fileType === 'xlsx') {
        setSelectedModelFile(file);
        dispatch(setModelFile(file));
      }
    }
  }, [dispatch]);

  const handleDropVN = useCallback((acceptedFiles: File[]) => {
    console.log('VN Drop:', acceptedFiles);
    if (acceptedFiles.length > 0) {
      handleDrop(acceptedFiles, 'csv');
    }
  }, [handleDrop]);

  const handleDropModel = useCallback((acceptedFiles: File[]) => {
    console.log('Model Drop:', acceptedFiles);
    if (acceptedFiles.length > 0) {
      handleDrop(acceptedFiles, 'xlsx');
    }
  }, [handleDrop]);

  const handleDropCargaTermica = useCallback((acceptedFiles: File[]) => {
    console.log('Carga Térmica Drop:', acceptedFiles);
    if (acceptedFiles.length > 0) {
      setAdditionalFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getRootPropsModel, getInputProps: getInputPropsModel } = useDropzone({
    onDrop: handleDropModel,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const { getRootProps: getRootPropsVN, getInputProps: getInputPropsVN } = useDropzone({
    onDrop: handleDropVN,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const { getRootProps: getRootPropsCargaTermica, getInputProps: getInputPropsCargaTermica } = useDropzone({
    onDrop: handleDropCargaTermica,
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
        {selectedVNFile ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ fontSize: '48px', color: '#333' }}>
              {selectedVNFile.type.includes('csv') ? <FaFileCsv /> : <FaFileExcel />}
            </div>
            <button onClick={() => setSelectedVNFile(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', color: '#333' }}>
              <FaTimes />
            </button>
          </div>
        ) : (
          <p>Drag & drop VN file here, or click to select one</p>
        )}
      </div>

      <div
        {...getRootPropsModel()}
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
        <input {...getInputPropsModel()} />
        {selectedModelFile ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ fontSize: '48px', color: '#333' }}>
              {selectedModelFile.type.includes('xlsx') ? <FaFileExcel /> : <FaFileCsv />}
            </div>
            <button onClick={() => setSelectedModelFile(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', color: '#333' }}>
              <FaTimes />
            </button>
          </div>
        ) : (
          <p>Drag & drop Model file here, or click to select one</p>
        )}
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
                {additionalFile.type.includes('xlsx') ? <FaFileExcel /> : <FaFileCsv />}
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
    </div>
  );
};

export default FileUpload;
