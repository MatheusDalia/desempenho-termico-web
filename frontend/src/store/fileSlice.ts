import { createSlice } from '@reduxjs/toolkit';

// Define o estado inicial diretamente
const initialState = {
  vnFile: null as File | null,
  csvFile: null as File | null,
  additionalFile: null as File | null,
  modelFile: null as File | null,
  interval: '',
  includeCargaTermica: false,
  data: [] as any[],
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setFile(state, action: { payload: File | null }) {
      state.vnFile = action.payload;
    },
    setComparisonFile(state, action: { payload: File | null }) {
      state.csvFile = action.payload;
    },
    setAdditionalFile(state, action: { payload: File | null }) {
      state.additionalFile = action.payload;
    },
    setModelFile(state, action: { payload: File | null }) {
      state.modelFile = action.payload;
    },
    setInterval(state, action: { payload: string }) {
      state.interval = action.payload;
    },
    setIncludeCargaTermica(state, action: { payload: boolean }) {
      state.includeCargaTermica = action.payload;
    },
    setData(state, action: { payload: any[] }) {
      state.data = action.payload;
    },
    clearFiles(state) {
      state.vnFile = null;
      state.csvFile = null;
      state.additionalFile = null;
      state.modelFile = null;
      state.data = [];
    },
  },
});

export const {
  setFile,
  setComparisonFile,
  setAdditionalFile,
  setModelFile,
  setInterval,
  setIncludeCargaTermica,
  setData,
  clearFiles,
} = fileSlice.actions;

export default fileSlice.reducer;
