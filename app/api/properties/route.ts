import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dataPath = path.join(process.cwd(), "data", "processed_data.json");
  const fileContents = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(fileContents);

  return NextResponse.json(data);
}
