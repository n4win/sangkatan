"use client";

import { useState, useEffect, useRef } from "react";
import {
  Stack,
  Text,
  Image,
  ActionIcon,
  Box,
  CloseButton,
  SimpleGrid,
  Badge,
  Skeleton,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { IconUpload, IconPhoto, IconX, IconTrash } from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";

// ------------------------------------------------------------------
// Shared upload / delete helpers (called from form submit, not on drop)
// ------------------------------------------------------------------

export async function uploadImageFile(
  file: File,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "อัพโหลดไม่สำเร็จ");
  }
  const data = await res.json();
  return data.url;
}

export async function deleteImageFile(url: string): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    // best-effort delete, don't block UI
  }
}

// ------------------------------------------------------------------
// Single image (Banner)
// Stores either a blob: URL (staged file) or a /uploads/... URL (saved)
// The staged File object is kept via onFileChange callback
// ------------------------------------------------------------------

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  onRemoveUploaded?: (url: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  height?: number;
}

export function ImageUpload({
  value,
  onChange,
  onFileChange,
  onRemoveUploaded,
  error,
  label = "รูปภาพ",
  required = false,
  height = 200,
}: ImageUploadProps) {
  const isStaged = value.startsWith("blob:");

  const handleDrop = (files: File[]) => {
    if (!files[0]) return;
    if (value && value.startsWith("blob:")) {
      URL.revokeObjectURL(value);
    }
    const blobUrl = URL.createObjectURL(files[0]);
    onFileChange(files[0]);
    onChange(blobUrl);
  };

  const handleRemove = () => {
    if (value.startsWith("blob:")) {
      URL.revokeObjectURL(value);
      onFileChange(null);
    } else if (value.startsWith("/uploads/")) {
      onRemoveUploaded?.(value);
    }
    onChange("");
    onFileChange(null);
  };

  return (
    <Stack gap={4}>
      {label && (
        <Text size="sm" fw={500}>
          {label}
          {required && (
            <Text span c="red" ml={4}>
              *
            </Text>
          )}
        </Text>
      )}

      {value ? (
        <Box
          pos="relative"
          style={{
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Image
            src={value}
            alt="preview"
            h={height}
            fit="cover"
            radius="md"
            fallbackSrc={`https://placehold.co/800x${height}?text=Preview`}
            loading="lazy"
            decoding="async"
          />
          {isStaged && (
            <Badge
              pos="absolute"
              bottom={8}
              left={8}
              color="yellow"
              variant="filled"
              size="sm"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
            >
              ยังไม่ได้บันทึก
            </Badge>
          )}
          <ActionIcon
            pos="absolute"
            top={8}
            right={8}
            variant="filled"
            color="red"
            size="md"
            radius="xl"
            onClick={handleRemove}
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Box>
      ) : (
        <Dropzone
          onDrop={handleDrop}
          accept={IMAGE_MIME_TYPE}
          maxSize={5 * 1024 * 1024}
          multiple={false}
          radius="md"
          styles={{
            root: {
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderColor: error ? "var(--mantine-color-red-5)" : undefined,
            },
          }}
        >
          <Stack align="center" gap="xs" style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconUpload size={32} color="var(--mantine-color-blue-5)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={32} color="var(--mantine-color-red-5)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={32} color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={500}>
                ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกรูป
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                รองรับ JPG, PNG, WebP, GIF (ไม่เกิน 5MB)
              </Text>
            </div>
          </Stack>
        </Dropzone>
      )}

      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}

// ------------------------------------------------------------------
// Multi image (Product)
// Each item is { url, alt, file? } — file is present for staged items
// ------------------------------------------------------------------

export interface StagedImage {
  url: string;
  alt?: string;
  file?: File;
}

interface MultiImageUploadProps {
  value: StagedImage[];
  onChange: (images: StagedImage[]) => void;
  onRemoveUploaded?: (url: string) => void;
  error?: string;
  label?: string;
  maxFiles?: number;
}

export function MultiImageUpload({
  value,
  onChange,
  onRemoveUploaded,
  error,
  label = "รูปภาพสินค้า",
  maxFiles = 5,
}: MultiImageUploadProps) {
  // Progressive rendering: render images in batches to prevent UI freeze
  const BATCH_SIZE = 3;
  const [visibleCount, setVisibleCount] = useState(value.length);
  const prevLenRef = useRef(value.length);

  useEffect(() => {
    const prevLen = prevLenRef.current;
    const curLen = value.length;
    prevLenRef.current = curLen;

    // Small change (add/remove 1-2): render immediately
    if (curLen - prevLen <= BATCH_SIZE) {
      setVisibleCount(curLen);
      return;
    }

    // Bulk load (edit mode): render progressively in batches
    let count = BATCH_SIZE;
    setVisibleCount(Math.min(count, curLen));

    if (count >= curLen) return;

    let rafId: number;
    const step = () => {
      count = Math.min(count + BATCH_SIZE, curLen);
      setVisibleCount(count);
      if (count < curLen) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value.length]);

  const handleDrop = (files: File[]) => {
    const remaining = maxFiles - value.length;
    const filesToAdd = files.slice(0, remaining);
    if (filesToAdd.length === 0) {
      NotificationService.error(`เลือกได้สูงสุด ${maxFiles} รูป`);
      return;
    }

    const newImages: StagedImage[] = filesToAdd.map((file) => ({
      url: URL.createObjectURL(file),
      alt: "",
      file,
    }));
    onChange([...value, ...newImages]);
  };

  const handleRemove = (index: number) => {
    const img = value[index];
    if (img.url.startsWith("blob:")) {
      URL.revokeObjectURL(img.url);
    } else if (img.url.startsWith("/uploads/")) {
      onRemoveUploaded?.(img.url);
    }
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Stack gap={4}>
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}

      {value.length > 0 && (
        <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="xs">
          {value.slice(0, visibleCount).map((img, index) => (
            <Box
              key={index}
              pos="relative"
              style={{
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
                border: "1px solid var(--mantine-color-gray-3)",
              }}
            >
              <Image
                src={img.url}
                alt={img.alt || "product"}
                h={80}
                fit="cover"
                loading="lazy"
                decoding="async"
              />
              {img.file && (
                <Badge
                  pos="absolute"
                  bottom={2}
                  left={2}
                  color="yellow"
                  variant="filled"
                  size="xs"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                >
                  ใหม่
                </Badge>
              )}
              <CloseButton
                pos="absolute"
                top={4}
                right={4}
                size="xs"
                variant="filled"
                color="red"
                radius="xl"
                onClick={() => handleRemove(index)}
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
              />
            </Box>
          ))}
          {visibleCount < value.length &&
            Array.from({ length: value.length - visibleCount }).map((_, i) => (
              <Skeleton key={`skel-${i}`} h={80} radius="md" />
            ))}
        </SimpleGrid>
      )}

      {value.length < maxFiles && (
        <Dropzone
          onDrop={handleDrop}
          accept={IMAGE_MIME_TYPE}
          maxSize={5 * 1024 * 1024}
          multiple
          radius="md"
          styles={{
            root: {
              minHeight: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          }}
        >
          <Stack align="center" gap={4} style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconUpload size={24} color="var(--mantine-color-blue-5)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={24} color="var(--mantine-color-red-5)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={24} color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>
            <Text size="xs" c="dimmed">
              คลิกหรือลากรูปมาวาง ({value.length}/{maxFiles})
            </Text>
          </Stack>
        </Dropzone>
      )}

      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}
