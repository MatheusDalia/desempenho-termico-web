// src/utils/dataUtils.ts
export const filterData = (data: any[], roomType: string) => {
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
  
  export const getMaxTemperature = (data: any[], key: string) => {
    const temperatures = data
      .map((row) => parseFloat(row[key]))
      .filter((t) => !isNaN(t));
    return parseFloat(Math.max(...temperatures).toFixed(2));
  };
  
  export const getMinTemperature = (data: any[], key: string) => {
    const temperatures = data
      .map((row) => parseFloat(row[key]))
      .filter((t) => !isNaN(t));
    return parseFloat(Math.min(...temperatures).toFixed(2));
  };
  
  export const getNhftValue = (data: any[], key: string, threshold: number) => {
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
  
