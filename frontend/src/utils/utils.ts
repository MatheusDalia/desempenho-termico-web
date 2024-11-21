// utils.ts
import { roundUpToTwoDecimals, roundToOneDecimal } from '../utils/calculateMetrics';
import {
    filterData,
    getMaxTemperature,
    getMinTemperature,
    getNhftValue,
  } from '../utils/dataUtils';
  import {processCargaTermica} from '../utils/thermalLoadProcessing';
  import * as ExcelJS from 'exceljs';

  interface ModelRow {
    Pavimento: string;
    Unidade: string;
    Nome: string;
    [key: string]: any; // Permite propriedades adicionais com string como chave
  }

export const processModelRow = async (
    modelRow: ModelRow,
    vnData: any[],
    selectedInterval: number,
    includeCargaTermica: boolean,
    additionalFile: File | null,
    areaColumnExists: boolean, // Passar a variável como argumento
  ) => {
    const { 'Tipo de ambiente': tipoAmbiente, Código: codigo, Pavimento, Unidade, Nome, Area: areaUh } = modelRow;
   
    if (!codigo || !tipoAmbiente) {
      console.warn(
        'Skipping row due to missing Código or Tipo de ambiente:',
        modelRow,
      );
      return null;
    }

    const filteredData = filterData(vnData, tipoAmbiente);
    // Pré-calcular strings repetitivas
    const zoneTempKey = `${codigo}:Zone Operative Temperature [C](Hourly)`;
    const [minTemp, maxTemp, nhftValue] = [
    roundUpToTwoDecimals(getMinTemperature(filteredData, zoneTempKey)),
    roundUpToTwoDecimals(getMaxTemperature(filteredData, zoneTempKey)),
    roundUpToTwoDecimals(getNhftValue(filteredData, zoneTempKey, selectedInterval))
  ];

    const phftValue = roundUpToTwoDecimals(
      tipoAmbiente === 'Quarto'
        ? (nhftValue / 3650) * 100
        : tipoAmbiente === 'Misto'
          ? (nhftValue / 6570) * 100
          : (nhftValue / 2920) * 100,
    );

    // Carga térmica processada condicionalmente
  let carga = 0;
  let cargaResfrValue = 0;
  if (includeCargaTermica) {
    ({ carga, cargaResfrValue } = await processCargaTermica(
      tipoAmbiente,
      codigo,
      filteredData,
      includeCargaTermica,
      additionalFile as File,
      selectedInterval
    ));
  }

    return {
      Pavimento: modelRow['Pavimento'],
      Unidade: modelRow['Unidade'],
      Código: codigo,
      Nome: modelRow['Nome'],
      'Tipo de ambiente': tipoAmbiente,
      ...(areaColumnExists && { Area: areaUh }),
      'MIN TEMP': minTemp,
      'MAX TEMP': maxTemp,
      NHFT: nhftValue,
      PHFT: phftValue,
      'CARGA RESF': includeCargaTermica
        ? roundUpToTwoDecimals(carga - cargaResfrValue)
        : undefined,
      'CARGA AQUE': includeCargaTermica
        ? roundUpToTwoDecimals(cargaResfrValue)
        : undefined,
      'CARGA TERM': includeCargaTermica
        ? roundUpToTwoDecimals(carga)
        : undefined,
    };
  };

  type CleanOutputRow = {
    Pavimento: string;
    Unidade: string;
    Código: string;
    Nome: string;
    ['Tipo de ambiente']: string;
    Area?: number;
    ['MIN TEMP']: number;
    ['MAX TEMP']: number;
    ['NHFT']?: number;
    ['PHFT']?: number;
    ['CARGA RESF']?: number;
    ['CARGA AQUE']?: number;
    ['CARGA TERM']?: number;
  };
  
  type SummaryEntry = {
    Pavimento: string;
    Unidade: string;
    MinTemp: number;
    MaxTemp: number;
    PHFT_Sum: number;
    CargaTermica_Sum: number;
    Area: number;
    Count: number;
  };
  
  type SummaryResult = {
    Pavimento: string;
    Unidade: string;
    MinTemp: number;
    MaxTemp: number;
    PHFT_Avg: number;
    PHFT_Min: number;
    CargaTermica_Sum: number;
  };
  
  export const createSummaryData = (cleanOutputData: CleanOutputRow[]): SummaryResult[] => {
    const summaryMap: Record<string, SummaryEntry> = {};

    cleanOutputData.forEach((row) => {
      if (!row) return;
  
      const key = `${row.Pavimento}_${row.Unidade}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          Pavimento: row.Pavimento,
          Unidade: row.Unidade,
          Area: row['Area'] || 0,
          MinTemp: row['MIN TEMP'],
          MaxTemp: row['MAX TEMP'],
          PHFT_Sum: row['PHFT'] || 0,
          CargaTermica_Sum: row['CARGA TERM'] || 0,
          Count: 1,
        };
      } else {
        const entry = summaryMap[key];
        entry.MinTemp = Math.min(entry.MinTemp, row['MIN TEMP']);
        entry.MaxTemp = Math.max(entry.MaxTemp, row['MAX TEMP']);
        entry.PHFT_Sum += row['PHFT'] || 0;
        entry.CargaTermica_Sum += row['CARGA TERM'] || 0;
        entry.Area += row['Area'] || 0;
        entry.Count += 1;
      }
    });

    return Object.values(summaryMap).map((entry) => {
      const PHFT_Avg = entry.PHFT_Sum / entry.Count;
      const cargaTermicaPorArea = entry.CargaTermica_Sum / entry.Area;

      const PHFT_Min = PHFT_Avg < 70
        ? 28 - 0.27 * PHFT_Avg
        : cargaTermicaPorArea < 100
          ? entry.Count === 1 ? 17 : 15
          : entry.Count === 1 ? 27 : 20;

      return {
        Pavimento: entry.Pavimento,
        Unidade: entry.Unidade,
        MinTemp: roundToOneDecimal(entry.MinTemp),
        MaxTemp: roundToOneDecimal(entry.MaxTemp),
        PHFT_Avg: roundUpToTwoDecimals(PHFT_Avg),
        PHFT_Min: roundUpToTwoDecimals(PHFT_Min),
        CargaTermica_Sum: roundUpToTwoDecimals(entry.CargaTermica_Sum),
      };
    });
  };

  
  export const generateWorkbook = async (sheets: { [sheetName: string]: any[] }): Promise<Uint8Array> => {
    const workbook = new ExcelJS.Workbook();
  
    const colorMapping: { [key: string]: string } = {
      'MIN TEMP': 'FFFFC000',
      MaxTemp: 'a52a2a',
      MinTemp: 'FFFFC000',
      'MAX TEMP': 'a52a2a',
      'Temp Max REF UH': 'a52a2a',
      'Temp Max REAL UH': 'a52a2a',
      NHFT: 'FF00B0F0',
      PHFT: '008000',
      PHFT_Avg: '008000',
      'PHFT REF UH': '008000',
      'PHFT REAL UH': '008000',
    };
  
    for (const [sheetName, data] of Object.entries(sheets)) {
      const worksheet = workbook.addWorksheet(sheetName);
  
      // Cabeçalho e formatação
      const headerCells = Object.keys(data[0]);
      const headerRow = worksheet.addRow(headerCells);
      headerRow.eachCell((cell, colNumber) => {
        const color = colorMapping[cell.value as string] || 'FF4F81BD';
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.alignment = { horizontal: 'center' };
        worksheet.getColumn(colNumber).width = 20;
      });
  
      // Dados e formatação
      data.forEach(row => {
        const newRow = worksheet.addRow(Object.values(row));
        Object.keys(row).forEach((key, index) => {
          const color = colorMapping[key];
          if (color) {
            newRow.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
          }
        });
  
        // Formatar célula "Status"
        if (row.Status) {
          const statusCell = newRow.getCell(headerCells.indexOf('Status') + 1);
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: row.Status === 'ATENDIDO' ? 'FF00FF00' : 'FFFF0000' },
          };
        }
        
      });
      
    }
  
    // Retornar como Uint8Array diretamente
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  };