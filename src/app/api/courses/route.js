import { NextResponse } from "next/server";
import { fetchCoursesFromSheet } from "@/lib/sheets";

export async function GET() {
  try {
    const courses = await fetchCoursesFromSheet();
    return NextResponse.json(courses || []);
  } catch (error) {
    console.error("Error fetching courses API:", error);
    return NextResponse.json({ error: "Failed to load course catalog from Google Sheets." }, { status: 500 });
  }
}
