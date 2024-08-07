import axios from 'axios';

export const uploadFile = async (file: File, type: 'vn' | 'csv') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return axios.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadAdditionalFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/api/upload-additional', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadFile = async (fileName: string) => {
  return axios.get(`/api/download/${fileName}`, {
    responseType: 'blob',
  });
};
