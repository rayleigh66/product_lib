import { NextResponse } from "next/server";

export function apiError(code: string, messageZh: string, messageEn: string, status = 400, details?: unknown) {
  return NextResponse.json({ code, message_zh: messageZh, message_en: messageEn, details }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
