import { NextResponse } from "next/server";

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}
