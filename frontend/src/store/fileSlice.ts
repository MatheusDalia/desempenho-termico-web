import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FileState {
  vnFile: File | null;
  csvFile: File | null;
  additionalFile: File | null;
  interval: string;
  includeCargaTermica: boolean;
  data: any[]; // Ajuste conforme os dados processados
}

const initialState: FileState = {
  vnFile: null,
  csvFile: null,
  additionalFile: null,
  interval: '',
  includeCargaTermica: false,
  data: [],
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setFile: (state, action: PayloadAction<File | null>) => {
      state.vnFile = action.payload;
    },
    setComparisonFile: (state, action: PayloadAction<File | null>) => {
      state.csvFile = action.payload;
    },
    setAdditionalFile: (state, action: PayloadAction<File | null>) => {
      state.additionalFile = action.payload;
    },
    setInterval: (state, action: PayloadAction<string>) => {
      state.interval = action.payload;
    },
    setIncludeCargaTermica: (state, action: PayloadAction<boolean>) => {
      state.includeCargaTermica = action.payload;
    },
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
    },
    clearFiles: (state) => {
      state.vnFile = null;
      state.csvFile = null;
      state.additionalFile = null;
      state.data = [];
    },
  },
});

export const { setFile, setComparisonFile, setAdditionalFile, setInterval, setIncludeCargaTermica, setData, clearFiles } = fileSlice.actions;
export default fileSlice.reducer;
