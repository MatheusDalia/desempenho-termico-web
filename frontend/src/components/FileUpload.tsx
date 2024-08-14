import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [interval, setInterval] = useState<string>('');
  const [includeCargaTermica, setIncludeCargaTermica] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);

  // Functions for data processing
  const filterData = (data: any[], roomType: string) => {
    return data.filter(row => row['Tipo'] === roomType);
  };

  const getMaxTemperature = (data: any[]) => {
    return Math.max(...data.map(row => row['Temperatura']));
  };

  const getMinTemperature = (data: any[]) => {
    return Math.min(...data.map(row => row['Temperatura']));
  };

  const getNhftValue = (data: any[], threshold: number) => {
    return data.filter(row => row['Temperatura'] < threshold).length;
  };

  // Process Excel files
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      console.log('Excel data:', json);

      // Example usage of data processing functions
      const filteredData = filterData(json, 'Sala');
      console.log('Max Temperature:', getMaxTemperature(filteredData));
      console.log('Min Temperature:', getMinTemperature(filteredData));
      console.log('NHFT Value (Threshold 25°C):', getNhftValue(filteredData, 25));
    };
    reader.readAsArrayBuffer(file);
  };

  // Process CSV files
  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        console.log('CSV data:', results.data);

        // Example usage of data processing functions
        const filteredData = filterData(results.data, 'Sala');
        console.log('Max Temperature:', getMaxTemperature(filteredData));
        console.log('Min Temperature:', getMinTemperature(filteredData));
        console.log('NHFT Value (Threshold 25°C):', getNhftValue(filteredData, 25));
      },
    });
  };

  const handleDrop = useCallback((acceptedFiles: File[], fileType: string) => {
    const file = acceptedFiles[0];
    if (file) {
      console.log(`File dropped: ${file.name}, Type: ${fileType}`);
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
  }, [dispatch]);

  const handleDropVN = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleDrop(acceptedFiles, 'csv');
    }
  }, [handleDrop]);

  const handleDropModel = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleDrop(acceptedFiles, 'xlsx');
    }
  }, [handleDrop]);

  const handleDropCargaTermica = useCallback((acceptedFiles: File[]) => {
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
            <option value="intervalo2">Intervalo 2 - 26,0 °C &lt; ToAPPa &lt; 35,0 °C</option>
          </select>
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
