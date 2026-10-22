import type { Project } from '../../shared/project';
export async function api<T = Project>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const mediaUrl = (projectId: string, path: string) => `/api/projects/${projectId}/media?path=${encodeURIComponent(path)}`;
