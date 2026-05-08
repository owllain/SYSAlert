import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Sistema de Alertas Interbancario API" });
}
