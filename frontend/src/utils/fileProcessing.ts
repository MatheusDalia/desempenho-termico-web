// src/utils/fileProcessing.ts
import * as XLSX from 'xlsx';

// Função para processar arquivos CSV
export const processCsvFile = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const parsedData = parseCsvData(text);
        resolve(parsedData);
      } else {
        reject('Erro ao ler o arquivo CSV');
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Função para processar arquivos Excel (XLSX)
export const processExcelFile = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      resolve(jsonData);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Função auxiliar para processar o conteúdo de um CSV
const parseCsvData = (csvText: string) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    const rowData: { [key: string]: any } = {};
    headers.forEach((header, index) => {
      rowData[header.trim()] = values[index].trim();
    });
    return rowData;
  });
  return rows;
};

