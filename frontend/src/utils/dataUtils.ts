// src/utils/dataUtils.ts
import { notifyError } from './notifyUtils';

export const filterData = (data: any[], roomType: string) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    notifyError(
      'Dados Inválidos',
      'Os dados fornecidos estão vazios ou não são válidos.',
    );
    return [];
  }

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
      (row) => parseFloat(row['SCH_OCUP_DORM:Schedule Value [](Hourly)']) === 1,
    );
  } else if (roomType === 'sala') {
    return cleanedData.filter(
      (row) => parseFloat(row['SCH_OCUP_SALA:Schedule Value [](Hourly)']) !== 0,
    );
  } else if (roomType === 'misto') {
    return cleanedData.filter(
      (row) =>
        parseFloat(row['SCH_OCUP_MISTO:Schedule Value [](Hourly)']) !== 0,
    );
  }

  return cleanedData;
};

export const getMaxTemperature = (data: any[], key: string) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    notifyError('Dados Inválidos', 'Os dados fornecidos estão vazios.');
    return NaN;
  }

  const temperatures = data
    .map((row) => parseFloat(row[key]))
    .filter((t) => !isNaN(t));

  if (temperatures.length === 0) {
    notifyError(
      'Dados Inválidos',
      `Nenhum valor de temperatura encontrado para a chave: ${key}.`,
    );
    return NaN;
  }

  return parseFloat(Math.max(...temperatures).toFixed(2));
};

export const getMinTemperature = (data: any[], key: string) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    notifyError('Dados Inválidos', 'Os dados fornecidos estão vazios.');
    return NaN;
  }
  const temperatures = data
    .map((row) => parseFloat(row[key]))
    .filter((t) => !isNaN(t));

  if (temperatures.length === 0) {
    notifyError(
      'Dados Inválidos',
      `Nenhum valor de temperatura encontrado para a chave: ${key}.`,
    );
    return NaN;
  }
  return parseFloat(Math.min(...temperatures).toFixed(2));
};

export const getNhftValue = (data: any[], key: string, threshold: number) => {
  const valueColumn = data
    .map((row) => parseFloat(row[key]))
    .filter((t) => !isNaN(t));

  if (valueColumn.length === 0) {
    notifyError('Erro', 'Nenhum valor válido encontrado.');
    return 0; // Or handle it in another way
  }

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

export const roundUpToTwoDecimals = (value: number): number =>
  Math.ceil(value * 100) / 100;

export const roundToOneDecimal = (value: number): number => {
  return Math.round(value * 10) / 10;
};

export const calculatePHFT = (
  nhftValue: number,
  tipoAmbiente: string,
): number =>
  tipoAmbiente === 'Quarto'
    ? (nhftValue / 3650) * 100
    : tipoAmbiente === 'Misto'
      ? (nhftValue / 6570) * 100
      : (nhftValue / 2920) * 100;
