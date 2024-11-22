import ExcelJS from 'exceljs';

export const generateWorkbook = async (
  sheets: Record<string, any[]>,
): Promise<Uint8Array> => {
  const workbook = new ExcelJS.Workbook();

  // Adicionando as planilhas
  Object.entries(sheets).forEach(([sheetName, data]) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Adicionando cabeçalhos
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Adicionando as linhas de dados
    data.forEach((row) => worksheet.addRow(Object.values(row)));
  });

  // Gerando o buffer e convertendo para Uint8Array
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
};
