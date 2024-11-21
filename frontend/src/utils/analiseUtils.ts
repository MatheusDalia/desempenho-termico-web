type DataRow = Record<string, any>;

export const initializeMap = (
  data: DataRow[],
  keyFields: string[],
  initialFields: Record<string, any>,
): Record<string, any> => {
  const map: Record<string, any> = {};

  data.forEach((row) => {
    const key = keyFields.map((field) => row[field]).join('-');
    if (!map[key]) {
      map[key] = { ...initialFields, ...row };
    }
  });

  return map;
};

export const calculateDeltas = (
  realValue: number | null,
  refValue: number | null,
): number | null => {
  if (realValue === null || refValue === null) return null;
  return Math.ceil((realValue - refValue) * 100) / 100;
};

export const evaluateStatus = (
  conditions: boolean[],
  pavimento: string,
): string => {
  if (
    pavimento.toLowerCase() === 'cobertura' &&
    (conditions[0] || conditions[1])
  ) {
    return 'NÃO ATENDIDO';
  }
  return conditions.some((cond) => cond) ? 'NÃO ATENDIDO' : 'ATENDIDO';
};