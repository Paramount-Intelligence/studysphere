import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { password } = await request.json();

    // Server-side password (completely hidden from the browser bundle)
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (password === expectedPassword) {
      return NextResponse.json({ authorized: true });
    } else {
      return NextResponse.json({ authorized: false, error: "Incorrect password. Access denied." }, { status: 401 });
    }
  } catch (error) {
    console.error("Admin authentication error:", error);
    return NextResponse.json({ authorized: false, error: "Server error during authentication." }, { status: 500 });
  }
}
