import Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
interface ModelRow {
  Pavimento: string;
  Unidade: string;
  Nome: string;
  [key: string]: any; // Permite propriedades adicionais com string como chave
}

// Função para parsear arquivos CSV usando PapaParse
// Função para parsear arquivos CSV usando PapaParse
export const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    Papa.parse(file, {
      header: true,
      chunk: (chunkResults) => {
        results.push(...chunkResults.data); // Adiciona os dados do chunk
      },
      complete: () => resolve(results), // Resolve quando terminar de processar
      error: (error: any) => reject(error), // Trata erros
    });
  });
};
let areaColumnExists = false;
// Função para parsear arquivos Excel usando FileReader e ExcelJS
export const parseModelExcel = (file: File): Promise<ModelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);

        // Criação de um novo workbook e leitura do arquivo
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data); // Carrega o buffer com o arquivo Excel

        const worksheet = workbook.worksheets[0]; // Obtém a primeira planilha
        const jsonData: ModelRow[] = [];

        // Verifica se a primeira linha existe
        const headerRow = worksheet.getRow(1);

        if (headerRow && headerRow.values) {
          // Verifica se `headerRow.values` é um array
          if (Array.isArray(headerRow.values)) {
            // Verifica se a coluna "Area" existe no cabeçalho (em um array esparso)
            areaColumnExists = headerRow.values.includes('Area');
          } else {
            // Se `headerRow.values` for um objeto, converte os valores em um array e verifica
            areaColumnExists = Object.values(headerRow.values).includes('Area');
          }
        }

        // Converte cada linha da planilha para um objeto JSON
        worksheet.eachRow(
          { includeEmpty: true },
          (row: any, rowNumber: number) => {
            if (rowNumber > 1) {
              // Ignora o cabeçalho (primeira linha)
              const rowData: ModelRow = {
                Pavimento: '',
                Unidade: '',
                Nome: '',
              };

              row.eachCell(
                { includeEmpty: true },
                (cell: any, colNumber: any) => {
                  const columnName = headerRow.getCell(colNumber)
                    ?.value as string; // Obtém o nome da coluna

                  if (columnName === 'Area' && areaColumnExists) {
                    rowData['Area'] = cell.value; // Só adiciona "Area" se ela existir
                  } else {
                    rowData[columnName] = cell.value; // Adiciona as outras colunas normalmente
                  }
                },
              );

              jsonData.push(rowData); // Adiciona a linha convertida ao array
            }
          },
        );

        resolve(jsonData); // Retorna os dados convertidos
      } catch (error) {
        reject(error); // Lida com erros
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo Excel'));
    reader.readAsArrayBuffer(file); // Lê o arquivo como um ArrayBuffer
  });
};
