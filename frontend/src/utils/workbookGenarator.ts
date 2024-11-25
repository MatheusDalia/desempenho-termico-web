import * as ExcelJS from 'exceljs';
const blobToUint8Array = (blob: Blob): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};
export const generateWorkbook = async (sheets: {
  [sheetName: string]: any[];
}): Promise<Uint8Array> => {
  const workbook = new ExcelJS.Workbook();

  // Mapeamento de colunas para cores
  const colorMapping: { [key: string]: string } = {
    'MIN TEMP': 'FFFFC000', // Cor para MIN TEMP
    MaxTemp: 'a52a2a',
    MinTemp: 'FFFFC000',
    'MAX TEMP': 'a52a2a', // Cor para MAX TEMP
    'Temp Max REF UH': 'a52a2a',
    'Temp Max REAL UH': 'a52a2a',
    NHFT: 'FF00B0F0', // Cor para NHFT
    PHFT: '008000', // Cor para PHFT
    PHFT_Avg: '008000',
    'PHFT REF UH': '008000',
    'PHFT REAL UH': '008000',
  };

  for (const [sheetName, data] of Object.entries(sheets)) {
    const worksheet = workbook.addWorksheet(sheetName);

    // Adiciona cabeçalho
    const headerCells = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headerCells);

    // Formatação do cabeçalho
    headerRow.eachCell((cell, colNumber) => {
      const columnName = cell.value as string;

      // Define cor personalizada se estiver no mapeamento
      const color = colorMapping[columnName] || 'FF4F81BD'; // Azul por padrão

      cell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // Cor da fonte (branca)
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }, // Cor personalizada ou padrão
      };
      cell.alignment = { horizontal: 'center' }; // Centralizar texto no cabeçalho
      worksheet.getColumn(colNumber).width = 20; // Aumenta a largura da célula
    });

    // Adiciona os dados
    data.forEach((row) => {
      const newRow = worksheet.addRow(Object.values(row));

      // Formatar as células conforme o nome das colunas
      Object.keys(row).forEach((key, index) => {
        const cell = newRow.getCell(index + 1); // +1 para ajustar ao índice da linha
        const color = colorMapping[key] || null;

        if (color) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }, // Cor personalizada para a célula
          };
        }
      });

      // Formatar as células de status, se a coluna 'Status' existir
      if (Object.prototype.hasOwnProperty.call(row, 'Status')) {
        const statusCell = newRow.getCell(headerCells.indexOf('Status') + 1);
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: row.Status === 'ATENDIDO' ? 'FF00FF00' : 'FFFF0000', // Verde para APROVADO, vermelho para REPROVADO
          },
        };
      }
    });
  }

  // Gera o arquivo Excel como Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Converte Blob para Uint8Array
  const uint8Array = await blobToUint8Array(blob);
  return uint8Array;
};
