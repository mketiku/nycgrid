import { NextResponse } from "next/server";
import { getAllActiveEventContexts } from "@/features/events/lib/active-events";

export const revalidate = 0; // always dynamic — event windows change

export async function GET() {
  try {
    const contexts = await getAllActiveEventContexts();
    return NextResponse.json(contexts);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
