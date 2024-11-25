import Papa from 'papaparse';
import ExcelJS from 'exceljs';

interface ModelRow {
  Pavimento: string;
  Unidade: string;
  Nome: string;
  [key: string]: any; // Permite propriedades adicionais com string como chave
}

export const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => resolve(results.data),
      error: (error: any) => reject(error),
    });
  });
};

export const parseModelExcel = (file: File): Promise<ModelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let areaColumnExists = false;

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);

        const worksheet = workbook.worksheets[0];
        const jsonData: ModelRow[] = [];
        const headerRow = worksheet.getRow(1);

        if (headerRow && headerRow.values) {
          areaColumnExists = Array.isArray(headerRow.values)
            ? headerRow.values.includes('Area')
            : Object.values(headerRow.values).includes('Area');
        }

        worksheet.eachRow(
          { includeEmpty: true },
          (row: any, rowNumber: number) => {
            if (rowNumber > 1) {
              const rowData: ModelRow = {
                Pavimento: '',
                Unidade: '',
                Nome: '',
              };

              row.eachCell(
                { includeEmpty: true },
                (cell: any, colNumber: any) => {
                  const columnName = headerRow.getCell(colNumber)
                    ?.value as string;

                  if (columnName === 'Area' && areaColumnExists) {
                    rowData['Area'] = cell.value;
                  } else {
                    rowData[columnName] = cell.value;
                  }
                },
              );

              jsonData.push(rowData);
            }
          },
        );

        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo Excel'));
    reader.readAsArrayBuffer(file);
  });
};
