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

const DB = new Map<string, WatchMedia>();

export async function getWatchMediaList() {
  return Array.from(DB.values());
}

export const createWatchMedia = action(
  async ({ input }) => {
    const id = crypto.randomUUID();
    const watchMedia: WatchMedia = {
      id,
      title: input.title,
      releaseDate: input.releaseDate,
      genres: input.genres,
      type: input.type,
      watched: input.watched,
      notes: input.notes,
      imageUrl: await uploadFile(input.image),
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
  const dir = path.join("..", "..", "..", "public", "images");

  if (!(await exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
  }

  const name = btoa(crypto.randomUUID()).replaceAll("=", "");
  const ext = path.extname(file.name).replace(/$\./, "");
  const fileName = `${name}.${ext}`;
  const filePath = path.join(dir, fileName);

  const fileData = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, fileData);
  console.log(`File written to '${filePath}'`);

  // Return url
  return `${process.env.BASE_URL}/${fileName}`;
}

async function exists(path: string) {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
