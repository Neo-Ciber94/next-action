"use server";
import { action } from "./action";
import {
  $valibot,
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


function createDB() {
  const globalThisWithDb = globalThis as { __DB?: Map<string, WatchMedia> };

  if (!globalThisWithDb.__DB) {
    globalThisWithDb.__DB = new Map<string, WatchMedia>();
  }

  return globalThisWithDb.__DB;
}

const DB = createDB();

export async function getWatchMediaList() {
  return Array.from(DB.values()).reverse();
}

export const createWatchMedia = action(
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

    DB.set(id, watchMedia);
    revalidatePath("/");
    return watchMedia;
  },
  {
    validator: $valibot(CreateWatchMediaSchema),
  },
);

export const toggleWatched = action(
  async ({ input }) => {
    const media = Array.from(DB.values()).find((m) => m.id === input.mediaId);

    if (media) {
      media.watched = input.watched;
    }

    revalidatePath("/");
  },
  {
    validator: $valibot(ToggleWatchMediaSchema),
  },
);

export const deleteWatchMedia = action.formAction(
  async ({ input }) => {
    const deleted = DB.delete(input.mediaId);
    revalidatePath("/");
    return deleted;
  },
  {
    validator: $valibot(DeleteWatchMediaSchema),
  },
);

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
