// src/utils/cargaUtils.ts
export function cargaTerm({
  cargaFilteredData,
  filteredData,
  codigo,
  codigoSolo,
  thresholdVar,
}: {
  cargaFilteredData: any[];
  filteredData: any[];
  codigo: string;
  codigoSolo: string;
  thresholdVar: number;
}): number {
  const filteredDataRenamed = filteredData.map((row: { [x: string]: any }) => {
    const renamedRow: { [key: string]: any } = {};
    for (const key in row) {
      renamedRow[`${key}_filtered`] = row[key];
    }
    return renamedRow;
  });

  cargaFilteredData = cargaFilteredData.map((row: any, index: number) => {
    return { ...row, ...filteredDataRenamed[index] };
  });

  const columnTitles = Object.keys(cargaFilteredData[0]);
  const tempThreshold = thresholdVar;
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
      (row: { [x: string]: number }) => row[temperatureColumnKey] > 26,
    );
  }

  if (columnTitles.includes(codigo)) {
    const totalSum = filteredRows.reduce(
      (sum: number, row: { [x: string]: any }) => {
        const value = parseFloat(row[`${codigo}`]);
        return sum + (isNaN(value) ? 0 : value);
      },
      0,
    );

    const additionalColumnKey = `${codigoSolo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Heating Energy [J](Hourly)`;
    if (columnTitles.includes(additionalColumnKey)) {
      const cargaResfrValue = filteredRows.reduce(
        (sum: number, row: { [x: string]: any }) => {
          const value = parseFloat(row[additionalColumnKey]);
          return sum + (isNaN(value) ? 0 : value);
        },
        0,
      );

      const finalSum = totalSum + cargaResfrValue;
      return finalSum / 3600000;
    }

    return totalSum / 3600000;
  } else {
    return 0;
  }
}

export const calculateCargaResfr = (
  cargaFilteredData: any[],
  codigoSolo: string,
  thresholdVar: number,
) => {
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

  const coolingColumnKey = `${codigoSolo} IDEAL LOADS AIR SYSTEM:Zone Ideal Loads Zone Total Cooling Energy [J](Hourly)`;
  const cargaResfrValue = filteredRows.reduce(
    (sum: number, row: { [x: string]: any }) => {
      const value = parseFloat(row[coolingColumnKey]);
      return sum + (isNaN(value) ? 0 : value);
    },
    0,
  );

  return cargaResfrValue / 3600000;
};
