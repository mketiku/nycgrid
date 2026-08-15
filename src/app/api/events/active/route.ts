import { NextResponse } from "next/server";
import { getAllActiveEventContexts } from "@/features/events/lib/active-events";
import { captureAppWarning } from "@/lib/monitoring/sentry";

export const revalidate = 0; // always dynamic — event windows change

export async function GET() {
  try {
    const contexts = await getAllActiveEventContexts();
    return NextResponse.json(contexts);
  } catch (error) {
    await captureAppWarning("events/active: active event context lookup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json([], { status: 200 });
  }
}
