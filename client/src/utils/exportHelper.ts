import { serverAPI } from '@/lib/api';

export const downloadExport = async (
  resource: string,
  format: 'pdf' | 'xlsx' | 'csv'
) => {
  try {
    const response = await serverAPI.get(`/export/${resource}/${format}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type']
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.setAttribute('download', `${resource}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data', error);
    alert('Failed to export data. Please try again.');
  }
};
