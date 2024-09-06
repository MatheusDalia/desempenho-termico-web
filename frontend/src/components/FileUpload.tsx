import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setFile, setModelFile } from '../store/fileSlice';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaFileCsv, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUpload.css';

const FileUpload: React.FC = () => {
  const dispatch = useDispatch();
  const [includeCargaTermica, setIncludeCargaTermica] =
    useState<boolean>(false);
  const [selectedVNFile, setSelectedVNFile] = useState<File | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<Blob | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<string>('28');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initialize as false

  const filterData = (data: any[], roomType: string) => {
    roomType = roomType.toLowerCase();
    const cleanedData = data.map((row) => {
      const cleanedRow: { [key: string]: any } = {};
      for (let key in row) {
        cleanedRow[key.trim()] = row[key];
      }
      return cleanedRow;
    });

    if (roomType === 'quarto') {
      return cleanedData.filter(
        (row) =>
          parseFloat(row['SCH_OCUP_DORM:Schedule Value [](Hourly)']) === 1,
      );
    } else if (roomType === 'sala') {
      return cleanedData.filter(
        (row) =>
          parseFloat(row['SCH_OCUP_SALA:Schedule Value [](Hourly)']) !== 0,
      );
    } else if (roomType === 'misto') {
      return cleanedData.filter(
        (row) =>
          parseFloat(row['SCH_OCUP_MISTO:Schedule Value [](Hourly)']) !== 0,
      );
    }

    return cleanedData;
  };

  const getMaxTemperature = (data: any[], key: string) => {
    const temperatures = data
      .map((row) => parseFloat(row[key]))
      .filter((t) => !isNaN(t));
    return parseFloat(Math.max(...temperatures).toFixed(2));
  };

  const getMinTemperature = (data: any[], key: string) => {
    const temperatures = data
      .map((row) => parseFloat(row[key]))
      .filter((t) => !isNaN(t));
    return parseFloat(Math.min(...temperatures).toFixed(2));
  };

  const getNhftValue = (data: any[], key: string, threshold: number) => {
    const valueColumn = data
      .map((row) => parseFloat(row[key]))
      .filter((t) => !isNaN(t));

    let count = 0;
    if (threshold === 26) {
      const subcount1 = valueColumn.filter((value) => value < 26).length;
      const subcount2 = valueColumn.filter((value) => value < 18).length;
      count = subcount1 - subcount2;
    } else {
      count = valueColumn.filter((value) => value < 28).length;
    }

    return count;
  };

  interface CargaTermInput {
    cargaFilteredData: any;
    filteredData: any;
    codigo: string;
    codigoSolo: string;
    thresholdVar: any;
  }

  // Alterar o parâmetro threshold para ser um número em vez de um booleano.
  function cargaTerm({
    cargaFilteredData,
    filteredData,
    codigo,
    codigoSolo,
    thresholdVar,
  }: CargaTermInput): number | number {
    // Rename the columns in filteredData if there are duplicates
    const filteredDataRenamed = filteredData.map(
      (row: { [x: string]: any }) => {
        const renamedRow: { [key: string]: any } = {};
        for (const key in row) {
          renamedRow[`${key}_filtered`] = row[key];
        }
        return renamedRow;
      },
    );

    console.log('Filtered Data Renamed:', filteredDataRenamed);

    // Add the columns of filteredData to cargaFilteredData
    cargaFilteredData = cargaFilteredData.map((row: any, index: number) => {
      return { ...row, ...filteredDataRenamed[index] };
    });

    console.log('Updated Carga Filtered Data:', cargaFilteredData);

    const columnTitles = Object.keys(cargaFilteredData[0]);
    console.log('Column Titles:', columnTitles);

    const tempThreshold = parseFloat(thresholdVar);
    const temperatureColumnKey = `${codigoSolo}:Zone Operative Temperature [C](Hourly)_filtered`;

    console.log('Temperature Column Key:', temperatureColumnKey);
    console.log('Temp Threshold:', tempThreshold);

    // Filter rows based on the temperature threshold
    let filteredRows;
    if (tempThreshold === 26) {
      const filteredRows1 = cargaFilteredData.filter(
        (row: { [x: string]: number }) => row[temperatureColumnKey] < 18,
      );
      const filteredRows2 = cargaFilteredData.filter(
        (row: { [x: string]: number }) => row[temperatureColumnKey] > 26,
      );
      filteredRows = [...filteredRows1, ...filteredRows2];
    } else {
      filteredRows = cargaFilteredData.filter(
        (row: { [x: string]: number }) =>
          row[temperatureColumnKey] > tempThreshold,
      );
    }

    console.log('Filtered Rows:', filteredRows);

    if (columnTitles.includes(codigo)) {
      // Calculate the sum of the values in the codigo column
      const totalSum = filteredRows.reduce(
        (sum: number, row: { [x: string]: any }) => {
          const value = parseFloat(row[codigo]);
          return sum + (isNaN(value) ? 0 : value);
        },
        0,
      );

      console.log('Total Sum of Codigo Column:', totalSum);

      const additionalColumnKey = `${codigoSolo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Heating Energy [J](Hourly)`;
      if (columnTitles.includes(additionalColumnKey)) {
        // Get the additional column values
        const cargaResfrValue = filteredRows.reduce(
          (sum: number, row: { [x: string]: any }) => {
            const value = parseFloat(row[additionalColumnKey]);
            return sum + (isNaN(value) ? 0 : value);
          },
          0,
        );

        console.log('Carga Resfr Value:', cargaResfrValue);

        const finalSum = totalSum + cargaResfrValue;
        const totalConverted = finalSum / 3600000;
        console.log('Final Sum:', finalSum);
        console.log('Total Converted:', totalConverted);
        return totalConverted;
      }

      const totalConverted = totalSum / 3600000;
      console.log('Total Converted (No Carga Resfr):', totalConverted);
      return totalConverted;
    } else {
      console.log('Codigo not found in column titles.');
      return 0;
    }
  }

  const calculateCargaResfr = (
    cargaFilteredData: any[],
    codigoSolo: string,
    thresholdVar: number,
  ) => {
    const columnTitles = Object.keys(cargaFilteredData[0]);
    const tempThreshold = parseFloat(thresholdVar.toString());
    const temperatureColumnKey = `${codigoSolo}:Zone Operative Temperature [C](Hourly)_filtered`;

    let filteredRows;
    if (tempThreshold === 26) {
      const filteredRows1 = cargaFilteredData.filter(
        (row: { [x: string]: number }) => row[temperatureColumnKey] < 18,
      );
      const filteredRows2 = cargaFilteredData.filter(
        (row: { [x: string]: number }) => row[temperatureColumnKey] > 26,
      );
      filteredRows = [...filteredRows1, ...filteredRows2];
    } else {
      filteredRows = cargaFilteredData.filter(
        (row: { [x: string]: number }) =>
          row[temperatureColumnKey] > tempThreshold,
      );
    }

    if (
      columnTitles.includes(
        `${codigoSolo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
      )
    ) {
      const cargaResfrValue = filteredRows.reduce(
        (sum: number, row: { [x: string]: any }) => {
          const value = parseFloat(
            row[
              `${codigoSolo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`
            ],
          );
          return sum + (isNaN(value) ? 0 : value);
        },
        0,
      );

      return cargaResfrValue / 3600000; // Convert to desired units (if necessary)
    } else {
      console.log('Column for Carga Resfr not found.');
      return 0;
    }
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
        filterData(json, 'Sala'); // Update as needed
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
          filterData(results.data, 'Sala'); // Update as needed
        } catch (error) {
          console.error('Error processing CSV file:', error);
        }
      },
    });
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

  const handleDeleteAdditionalFile = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation(); // Prevent the input from opening
    setAdditionalFile(null);
  };

  const handleDrop = useCallback(
    (acceptedFiles: File[], fileType: string) => {
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
    console.log('HandleDropCargaTermica Start');
    if (acceptedFiles.length > 0) {
      setAdditionalFile(acceptedFiles[0]);
      console.log('File set:', acceptedFiles[0]);
    }
    console.log('HandleDropCargaTermica End');
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

  // Atualize o valor do parâmetro threshold para ser um número, como 1 ou 26.
  const generateOutputFile = async () => {
    if (selectedVNFile && selectedModelFile) {
      setIsLoading(true); // Start loading spinner
      try {
        // Process VN file
        const vnData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(selectedVNFile, {
            header: true,
            complete: (results: Papa.ParseResult<any>) => resolve(results.data),
            error: (error: any) => reject(error),
          });
        });

        // Process Model Excel file
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const modelData: { [key: string]: any }[] =
              XLSX.utils.sheet_to_json(worksheet);

            const outputData = await Promise.all(
              modelData.map(async (modelRow) => {
                const codigo = modelRow['Código'];
                const tipoAmbiente = modelRow['Tipo de ambiente'];

                if (!codigo || !tipoAmbiente) {
                  console.warn(
                    'Skipping row due to missing Código or Tipo de ambiente:',
                    modelRow,
                  );
                  return null;
                }

                const filteredData = filterData(vnData, tipoAmbiente);
                const minTemp = getMinTemperature(
                  filteredData,
                  `${codigo}:Zone Operative Temperature [C](Hourly)`,
                );
                const maxTemp = getMaxTemperature(
                  filteredData,
                  `${codigo}:Zone Operative Temperature [C](Hourly)`,
                );
                const numericSelectedInterval = parseFloat(
                  selectedInterval as string,
                );
                const nhftValue = getNhftValue(
                  filteredData,
                  `${codigo}:Zone Operative Temperature [C](Hourly)`,
                  numericSelectedInterval,
                );
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
                    const cargaData = await new Promise<any[]>(
                      (resolve, reject) => {
                        Papa.parse(additionalFile, {
                          header: true,
                          complete: (results: Papa.ParseResult<any>) =>
                            resolve(results.data),
                          error: (error: any) => reject(error),
                        });
                      },
                    );

                    const cargaFilteredData = filterData(
                      cargaData,
                      tipoAmbiente,
                    );

                    const cargaTermicaResult = cargaTerm({
                      cargaFilteredData,
                      filteredData,
                      codigo: `${codigo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`,
                      codigoSolo: codigo,
                      thresholdVar: 26,
                    });
                    cargaResfrValue = calculateCargaResfr(
                      cargaFilteredData,
                      codigo,
                      26,
                    );
                    carga = cargaTermicaResult;
                  } catch (error) {
                    console.error(
                      'Erro ao processar arquivo de Carga Térmica:',
                      error,
                    );
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
                  'CARGA RESF': includeCargaTermica
                    ? carga - cargaResfrValue
                    : undefined,
                  'CARGA AQUE': includeCargaTermica
                    ? cargaResfrValue
                    : undefined,
                  'CARGA TERM': includeCargaTermica ? carga : undefined,
                };
              }),
            );

            // Remove null entries
            const cleanOutputData = outputData.filter((row) => row !== null);

            // Create the summary data
            const summaryData: any[] = [];
            const summaryMap: { [key: string]: any } = {};

            cleanOutputData.forEach((row) => {
              if (row) {
                // Verifica se row não é null
                const key = `${row.Pavimento}_${row.Unidade}`;
                if (!summaryMap[key]) {
                  summaryMap[key] = {
                    Pavimento: row.Pavimento,
                    Unidade: row.Unidade,
                    MinTemp: row['MIN TEMP'],
                    MaxTemp: row['MAX TEMP'],
                    PHFT_Sum: row.PHFT || 0,
                    CargaTermica_Sum: row['CARGA TERM'] || 0,
                    Count: 1,
                  };
                } else {
                  summaryMap[key].MinTemp = Math.min(
                    summaryMap[key].MinTemp,
                    row['MIN TEMP'],
                  );
                  summaryMap[key].MaxTemp = Math.max(
                    summaryMap[key].MaxTemp,
                    row['MAX TEMP'],
                  );
                  summaryMap[key].PHFT_Sum += row.PHFT || 0;
                  summaryMap[key].CargaTermica_Sum += row['CARGA TERM'] || 0;
                  summaryMap[key].Count += 1;
                }
              }
            });

            for (const key in summaryMap) {
              const entry = summaryMap[key];
              summaryData.push({
                Pavimento: entry.Pavimento,
                Unidade: entry.Unidade,
                MinTemp: entry.MinTemp,
                MaxTemp: entry.MaxTemp,
                PHFT_Avg: entry.PHFT_Sum / entry.Count,
                CargaTermica_Sum: entry.CargaTermica_Sum,
              });
            }

            // Create worksheets for both the output data and summary
            const outputWorksheet = XLSX.utils.json_to_sheet(cleanOutputData);
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);

            // Create a new workbook and append both sheets
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(
              newWorkbook,
              outputWorksheet,
              'Output',
            );
            XLSX.utils.book_append_sheet(
              newWorkbook,
              summaryWorksheet,
              'Summary',
            );

            // Write the workbook to an array
            const output = XLSX.write(newWorkbook, { type: 'array' });

            // Set the generated file to the outputFile state
            setOutputFile(
              new Blob([output], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
            );
          } catch (error) {
            console.error('Error processing model file:', error);
          } finally {
            setIsLoading(false); // Stop loading spinner
          }
        };
        reader.readAsArrayBuffer(selectedModelFile);
      } catch (error) {
        console.error('Error processing VN file:', error);
      }
    } else {
      console.warn('VN file or model file not selected.');
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
      {/* Title */}
      <h1 style={{ marginBottom: '20px' }}>Análise Térmica</h1>
      <div
        {...getRootPropsVN()}
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          width: '300px',
          position: 'relative',
        }}
      >
        <input {...getInputPropsVN()} />
        {selectedVNFile ? (
          <div style={{ position: 'relative' }}>
            <FaFileCsv size={48} />
            <p>{selectedVNFile.name}</p>
            <button
              onClick={handleDeleteVNFile}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#ff4d4d', // Red background
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: '5px',
                fontSize: '16px',
                width: '30px', // Adjust size as needed
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Shadow for better visibility
                transition: 'background-color 0.3s ease', // Smooth background color change
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#ff3333')
              } // Darker red on hover
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#ff4d4d')
              }
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <p>Drag & drop a VN CSV file here, or click to select</p>
        )}
      </div>

      <div
        {...getRootPropsModel()}
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          width: '300px',
          marginTop: '20px',
        }}
      >
        <input {...getInputPropsModel()} />
        {selectedModelFile ? (
          <div style={{ position: 'relative' }}>
            <FaFileExcel size={48} />
            <p>{selectedModelFile.name}</p>
            <button
              onClick={handleDeleteModelFile}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#ff4d4d', // Red background
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: '5px',
                fontSize: '16px',
                width: '30px', // Adjust size as needed
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Shadow for better visibility
                transition: 'background-color 0.3s ease', // Smooth background color change
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#ff3333')
              } // Darker red on hover
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#ff4d4d')
              }
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <p>Drag & drop a Model Excel file here, or click to select</p>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>
          Interval:
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
          >
            <option value="26">
              Intervalo 1 - 18,0 °C &lt; ToAPPa &lt; 26,0 °C
            </option>
            <option value="32">Intervalo 2 - ToAPP &lt; 32,0 °C</option>
            <option value="38">Intervalo 3 - ToAPP &lt; 38,0 °C</option>
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
          Include Carga Térmica
        </label>
      </div>

      {includeCargaTermica && (
        <div
          {...getRootPropsCargaTermica()}
          style={{
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            width: '300px',
            marginTop: '20px',
          }}
        >
          <input {...getInputPropsCargaTermica()} />
          {additionalFile ? (
            <div style={{ position: 'relative' }}>
              <FaFileExcel size={48} />
              <p>{additionalFile.name}</p>
              <button
                onClick={handleDeleteAdditionalFile}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#ff4d4d', // Red background
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: '5px',
                  fontSize: '16px',
                  width: '30px', // Adjust size as needed
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Shadow for better visibility
                  transition: 'background-color 0.3s ease', // Smooth background color change
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#ff3333')
                } // Darker red on hover
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#ff4d4d')
                }
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <p>Drag & drop a Carga Térmica file here, or click to select</p>
          )}
        </div>
      )}

      <button
        onClick={generateOutputFile}
        disabled={!selectedVNFile || !selectedModelFile}
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

export default FileUpload;
