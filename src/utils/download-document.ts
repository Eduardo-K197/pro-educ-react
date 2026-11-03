import axios from 'src/utils/axios';

export async function downloadAuthenticatedPdf(
  path: string,
  filename: string,
  params?: Record<string, string>
) {
  const response = await axios.get<Blob>(path, {
    params,
    responseType: 'blob',
    timeout: 60000,
    headers: { Accept: 'application/pdf' },
  });
  if ((await response.data.slice(0, 5).text()) !== '%PDF-')
    throw new Error('O documento não foi retornado como PDF. Tente novamente.');
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
