import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FileState {
  vnFile: File | null;
  csvFile: File | null;
  additionalFile: File | null;
  modelFile: File | null;  // New state for Model File
  interval: string;
  includeCargaTermica: boolean;
  data: any[];
}

const initialState: FileState = {
  vnFile: null,
  csvFile: null,
  additionalFile: null,
  modelFile: null,  // Initialize Model File state
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
    setModelFile: (state, action: PayloadAction<File | null>) => {  // New action for Model File
      state.modelFile = action.payload;
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
      state.modelFile = null;  // Clear Model File state
      state.data = [];
    },
  },
});

export const { setFile, setComparisonFile, setAdditionalFile, setModelFile, setInterval, setIncludeCargaTermica, setData, clearFiles } = fileSlice.actions;
export default fileSlice.reducer;
