import { NextResponse, type NextRequest } from "next/server";
import { cleanupStaleEvents } from "@/server/events";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "error", errors: ["cron_secret_missing"] },
      { status: 500 },
    );
  }

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { status: "error", errors: ["unauthorized"] },
      { status: 401 },
    );
  }

  const result = await cleanupStaleEvents();

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", errors: result.errors },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "success",
    deletedCount: result.deletedCount,
  });
}
