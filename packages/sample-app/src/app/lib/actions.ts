"use server";
import { action } from "./client";
import {
  CreateWatchMediaSchema,
  DeleteWatchMediaSchema,
  ToggleWatchMediaSchema,
  type WatchMedia,
} from "./schema";
import path from "path";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { ActionError } from "next-action";
import sharp from "sharp";
import { DB } from "./db";
import $valibot from "next-action/validators/valibot";

export async function getWatchMediaList() {
  return Array.from(DB.data.values()).reverse();
}

export const createWatchMedia = action(
  $valibot(CreateWatchMediaSchema),
  async ({ input }) => {
    const id = crypto.randomUUID();
    const image = input.image.get("image") as File;

    if (!(image instanceof File)) {
      throw new ActionError("Missing image");
    }

    const watchMedia: WatchMedia = {
      id,
      title: input.title,
      releaseDate: input.releaseDate,
      genres: input.genres,
      type: input.type,
      watched: input.watched,
      notes: input.notes,
      imageUrl: await uploadFile(image),
    };

    DB.data.set(id, watchMedia);
    revalidatePath("/");
    return watchMedia;
  });

export const toggleWatched = action(
  $valibot(ToggleWatchMediaSchema),
  async ({ input }) => {
    const media = Array.from(DB.data.values()).find((m) => m.id === input.mediaId);

    if (media) {
      media.watched = input.watched;
    }

    revalidatePath("/");
  });

export const deleteAllWatchMedia = async () => {
  return Promise.resolve(DB.destroy());
};

export const deleteWatchMedia = action.formAction(
  $valibot(DeleteWatchMediaSchema),
  async ({ input }) => {
    const watchMedia = DB.data.get(input.mediaId);
    const deleted = DB.data.delete(input.mediaId);

    // Delete file
    if (watchMedia) {
      const imagePath = path.join(process.cwd(), watchMedia.imageUrl);
      if (await exists(imagePath)) {
        await fs.unlink(imagePath);
      }
    }

    revalidatePath("/");
    return deleted;
  });

async function uploadFile(file: File) {
  const dir = path.join(process.cwd(), "public", "images");

  if (!(await exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
  }

  const name = btoa(crypto.randomUUID()).replaceAll("=", "");
  const ext = path.extname(file.name).replace(/^\./, "");
  const fileName = `${name}.${ext}`;
  const filePath = path.join(dir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  const fileData = await sharp(arrayBuffer).resize(256).toBuffer();

  await fs.writeFile(filePath, fileData);
  console.log(`File written to '${path.resolve(filePath)}'`);

  // Return url
  return `${process.env.BASE_URL}/images/${fileName}`;
}

async function exists(path: string) {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
