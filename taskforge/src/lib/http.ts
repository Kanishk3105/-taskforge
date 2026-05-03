export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as {
    data?: T;
    error?: { code: string; message: string; details?: unknown };
  };
  if (!res.ok || json.error) {
    const err = json.error ?? {
      code: "http_error",
      message: res.statusText,
    };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json.data as T;
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
  return parseResponse<T>(res);
}
