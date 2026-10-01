import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";

const s3 = new S3Client({ region: config.AWS_REGION });

export function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function saveReceipt(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (config.AWS_S3_BUCKET) {
    await s3.send(new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: "AES256"
    }));
    return;
  }

  const filePath = path.resolve(config.UPLOAD_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer, { flag: "wx" });
}

export async function readReceipt(key: string): Promise<Buffer> {
  if (config.AWS_S3_BUCKET) {
    const result = await s3.send(new GetObjectCommand({ Bucket: config.AWS_S3_BUCKET, Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error("Receipt object is empty.");
    return Buffer.from(bytes);
  }
  return readFile(path.resolve(config.UPLOAD_DIR, key));
}

export async function deleteReceipt(key: string): Promise<void> {
  if (config.AWS_S3_BUCKET) {
    await s3.send(new DeleteObjectCommand({ Bucket: config.AWS_S3_BUCKET, Key: key }));
    return;
  }
  await unlink(path.resolve(config.UPLOAD_DIR, key));
}