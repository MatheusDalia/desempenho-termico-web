import { configureStore } from '@reduxjs/toolkit';
import fileReducer from './fileSlice';

// Configura o store
const store = configureStore({
  reducer: {
    file: fileReducer,
  },
});

// Exporta os tipos para uso em outras partes do aplicativo
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
