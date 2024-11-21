export const createSummaryData = (cleanOutputData: any[]) => {
    return cleanOutputData.reduce((summaryMap, row) => {
      if (!row) return summaryMap;
  
      const key = `${row.Pavimento}_${row.Unidade}`;
      const current = summaryMap[key] || {
        Pavimento: row.Pavimento,
        Unidade: row.Unidade,
        MinTemp: row['MIN TEMP'],
        MaxTemp: row['MAX TEMP'],
        PHFT_Sum: 0,
        CargaTermica_Sum: 0,
        Count: 0,
      };
  
      current.MinTemp = Math.min(current.MinTemp, row['MIN TEMP']);
      current.MaxTemp = Math.max(current.MaxTemp, row['MAX TEMP']);
      current.PHFT_Sum += row['PHFT'] || 0;
      current.CargaTermica_Sum += row['CARGA TERM'] || 0;
      current.Count += 1;
  
      summaryMap[key] = current;
      return summaryMap;
    }, {});
  };
  