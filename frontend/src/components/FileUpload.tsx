import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [includeCargaTermica, setIncludeCargaTermica] = useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<Blob | null>(null);

  const filterData = (data: any[], roomType: string) => {
    roomType = roomType.toLowerCase();
    const cleanedData = data.map(row => {
      const cleanedRow: { [key: string]: any } = {};
      for (let key in row) {
        cleanedRow[key.trim()] = row[key];
      }
      return cleanedRow;
    });
  
    if (roomType === "quarto") {
      return cleanedData.filter(row => parseFloat(row['SCH_OCUP_DORM:Schedule Value [](Hourly)']) === 1);
    } else if (roomType === "sala") {
      return cleanedData.filter(row => parseFloat(row['SCH_OCUP_SALA:Schedule Value [](Hourly)']) !== 0);
    } else if (roomType === "misto") {
      return cleanedData.filter(row => parseFloat(row['SCH_OCUP_MISTO:Schedule Value [](Hourly)']) !== 0);
    }
  
    return cleanedData;
  };

  const getMaxTemperature = (data: any[]) => {
    const temperatures = data.map(row => parseFloat(row['Temperatura'])).filter(t => !isNaN(t));
    return Math.max(...temperatures);
  };
  
  const getMinTemperature = (data: any[]) => {
    const temperatures = data.map(row => parseFloat(row['Temperatura'])).filter(t => !isNaN(t));
    return Math.min(...temperatures);
  };

  const getNhftValue = (data: any[], threshold: number) => {
    return data.filter(row => parseFloat(row['Temperatura']) < threshold).length;
  };

  // Process Excel files
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
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
      } catch (error) {
        console.error('Error processing Excel file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process CSV files
  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        try {
          console.log('CSV data:', results.data);

          // Example usage of data processing functions
          const filteredData = filterData(results.data, 'Sala');
          console.log('Max Temperature:', getMaxTemperature(filteredData));
          console.log('Min Temperature:', getMinTemperature(filteredData));
          console.log('NHFT Value (Threshold 25°C):', getNhftValue(filteredData, 25));
        } catch (error) {
          console.error('Error processing CSV file:', error);
        }
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
  });

  const { getRootProps: getRootPropsVN, getInputProps: getInputPropsVN } = useDropzone({
    onDrop: handleDropVN,
    accept: {
      'text/csv': ['.csv'],
    },
  });

  const { getRootProps: getRootPropsCargaTermica, getInputProps: getInputPropsCargaTermica } = useDropzone({
    onDrop: handleDropCargaTermica,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
  });

  const generateOutputFile = async () => {
    if (selectedVNFile && selectedModelFile) {
      try {
        const vnData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(selectedVNFile, {
            header: true,
            complete: (results: Papa.ParseResult<any>) => resolve(results.data),
            error: (error) => reject(error),
          });
        });

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const modelData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(worksheet);

            const outputData = modelData.map((modelRow) => {
              const codigo = modelRow['Codigo'];
              const tipoAmbiente = modelRow['Tipo de ambiente'];
              const filteredData = filterData(vnData, tipoAmbiente);
              console.log('Filtrado', codigo);
              const minTemp = getMinTemperature(filteredData);
              const maxTemp = getMaxTemperature(filteredData);
              const nhftValue = getNhftValue(filteredData, 25);

              let phftValue = 0;
              if (tipoAmbiente === "Quarto") {
                phftValue = (nhftValue / 3650) * 100;
              } else if (tipoAmbiente === "Misto") {
                phftValue = (nhftValue / 6570) * 100;
              } else {
                phftValue = (nhftValue / 2920) * 100;
              }

              return {
                "Pavimento": modelRow['Pavimento'],
                "Unidade": modelRow['Unidade'],
                "Código": codigo,
                "Nome": modelRow['Nome'],
                "Tipo de ambiente": tipoAmbiente,
                "MIN TEMP": minTemp,
                "MAX TEMP": maxTemp,
                "NHFT": nhftValue,
                "PHFT": phftValue,
              };
            });

            const newWorksheet = XLSX.utils.json_to_sheet(outputData);
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Output');

            const output = XLSX.write(newWorkbook, { type: 'array' });
            setOutputFile(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
          } catch (error) {
            console.error('Error generating output file:', error);
          }
        };
        reader.readAsArrayBuffer(selectedModelFile);
      } catch (error) {
        console.error('Error processing VN file:', error);
      }
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div {...getRootPropsVN()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', width: '300px' }}>
        <input {...getInputPropsVN()} />
        {selectedVNFile ? (
          <div>
            <FaFileCsv size={48} />
            <p>{selectedVNFile.name}</p>
          </div>
        ) : (
          <p>Drag & drop a VN CSV file here, or click to select</p>
        )}
      </div>

      <div {...getRootPropsModel()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', width: '300px', marginTop: '20px' }}>
        <input {...getInputPropsModel()} />
        {selectedModelFile ? (
          <div>
            <FaFileExcel size={48} />
            <p>{selectedModelFile.name}</p>
          </div>
        ) : (
          <p>Drag & drop a Model Excel file here, or click to select</p>
        )}
      </div>

      {includeCargaTermica && (
        <div {...getRootPropsCargaTermica()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', width: '300px', marginTop: '20px' }}>
          <input {...getInputPropsCargaTermica()} />
          {additionalFile ? (
            <div>
              <FaFileExcel size={48} />
              <p>{additionalFile.name}</p>
            </div>
          ) : (
            <p>Drag & drop a Carga Térmica file here, or click to select</p>
          )}
        </div>
      )}

      <button
        onClick={generateOutputFile}
        disabled={!selectedVNFile || !selectedModelFile}
        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Generate and Download Output File
      </button>
      {outputFile && (
        <a
          href={URL.createObjectURL(outputFile)}
          download="output.xlsx"
          style={{ marginTop: '10px', textDecoration: 'none', color: '#007bff' }}
        >
          Download Generated File
        </a>
      )}
    </div>
  );
};

export default FileUpload;
