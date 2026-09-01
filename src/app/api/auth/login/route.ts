import { NextResponse } from "next/server";
import { validatePasscode, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json(
        { error: "Passcode is required" },
        { status: 400 }
      );
    }

    if (!validatePasscode(passcode)) {
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 401 }
      );
    }

    await setSession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
