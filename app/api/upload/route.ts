import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, access } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";

const BASE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FOLDERS = ["banner", "product", "activity", "slip", "proof"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF เท่านั้น" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 5MB" },
        { status: 400 },
      );
    }

    if (folder && !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: "โฟลเดอร์ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const uploadDir = folder
      ? path.join(BASE_UPLOAD_DIR, folder)
      : BASE_UPLOAD_DIR;
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = folder
      ? `/uploads/${folder}/${filename}`
      : `/uploads/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัพโหลดไฟล์" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "ไม่พบ URL" }, { status: 400 });
    }

    if (!url.startsWith("/uploads/")) {
      return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
    }

    const relativePath = url.replace(/^\/uploads\//, "");

    if (relativePath.includes("..")) {
      return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
    }

    const filepath = path.join(BASE_UPLOAD_DIR, relativePath);

    try {
      await access(filepath);
      await unlink(filepath);
    } catch {
      // file doesn't exist, that's ok
    }

    return NextResponse.json({ message: "ลบไฟล์สำเร็จ" });
  } catch (error) {
    console.error("Delete Upload Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบไฟล์" },
      { status: 500 },
    );
  }
}
