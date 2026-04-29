export const papersServerHealthProcedure = '/tnet.papers.v1.HealthService/Check';

export interface PapersServerHealthResponse {
  status?: string;
}

export type PapersServerFetch = (
  input: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{
  ok: boolean;
  json: () => Promise<PapersServerHealthResponse>;
}>;

export const checkPapersServerHealth = async (
  baseUrl: string,
  fetchImpl: PapersServerFetch = fetch
): Promise<boolean> => {
  try {
    const response = await fetchImpl(`${baseUrl}${papersServerHealthProcedure}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    if (!response.ok) return false;

    const body = await response.json();
    return body.status === 'ok';
  } catch {
    return false;
  }
};
