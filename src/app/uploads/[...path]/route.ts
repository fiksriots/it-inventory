import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Resolve base uploads directory absolute path
    const baseUploadsDir = path.resolve(process.cwd(), "public", "uploads");
    
    // Resolve target file absolute path securely
    const filePath = path.resolve(baseUploadsDir, ...pathArray);

    // Security Check: Prevent Directory Traversal attacks
    if (!filePath.startsWith(baseUploadsDir)) {
      return new NextResponse("Forbidden Access", { status: 403 });
    }

    // Check if file exists on local server disk
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found on local disk", { status: 404 });
    }

    // Read file content
    const fileBuffer = fs.readFileSync(filePath);

    // Determine accurate Content-Type header
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error serving local upload asset:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
