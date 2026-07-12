import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/api/auth";

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found");
  }
}
