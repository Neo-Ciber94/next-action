import { describe, beforeAll, afterAll, expect, test } from "vitest";
import path from "path";
import fs from "fs/promises";
import { createServerActionClient } from "next-action/testing/client";
import { type TestActions } from "@/app/api/testactions/[...testactions]/route";
import { startNextTestServer, type NextTestServer } from "../helpers/nextTestServer";

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess: NextTestServer | undefined = undefined;

beforeAll(async () => {
  serverProcess = await startNextTestServer({
    port: PORT,
    envVars: {
      EXPOSE_SERVER_ACTIONS: "1",
      NO_SEED_DATABASE: "1",
    },
  });
}, 120_000);

afterAll(async () => {
  serverProcess?.stop();
  await removePublicImages();
});

describe("MediaWatch List", () => {
  const client = createServerActionClient<TestActions>(`${BASE_URL}/api/testactions`);

  afterAll(async () => {
    try {
      await client.deleteAllWatchMedia();
    } catch (err) {
      console.error(err);
    }
  });

  test("Should call test action", { timeout: 60_000 }, async () => {
    await expect(client.getWatchMediaList().then((x) => x.json())).resolves.toStrictEqual([]);

    // Create
    const actionRes1 = await client.createWatchMedia({
      title: "Title 1",
      watched: true,
      releaseDate: new Date(2024, 3, 6),
      genres: new Set(["genre1", "genre2"]),
      type: "movie",
      notes: "Notes",
      image: await readArtifactAsFormData("image", "image.jpg"),
    });

    expect(actionRes1.ok).toBeTruthy();
    const ret1 = await actionRes1.json();

    expect(ret1).toEqual({
      success: true,
      data: expect.objectContaining({ watched: true, title: "Title 1" }),
    });

    const ret2 = await client
      .createWatchMedia({
        title: "Title 2",
        watched: false,
        releaseDate: new Date(2024, 3, 1),
        genres: new Set(["genre1", "genre3"]),
        type: "series",
        notes: "Notes 2",
        image: await readArtifactAsFormData("image", "image.jpg"),
      })
      .then((x) => x.json());

    expect(ret2).toEqual({
      success: true,
      data: expect.objectContaining({ watched: false, title: "Title 2" }),
    });

    await expect(client.getWatchMediaList().then((x) => x.json())).resolves.toHaveLength(2);
    const lastAddedId = ret2.success ? ret2.data.id : throwUnreachable();

    // Update
    await expect(
      client
        .toggleWatched({
          watched: true,
          mediaId: lastAddedId,
        })
        .then((x) => x.json()),
    ).resolves.toStrictEqual({ success: true, data: void 0 });

    await expect(client.getWatchMediaList().then((x) => x.json())).resolves.toEqual([
      expect.objectContaining({ watched: true }),
      expect.objectContaining({ watched: true }),
    ]);

    // Delete
    await expect(
      client.deleteWatchMedia(asFormData("mediaId", lastAddedId)).then((x) => x.json()),
    ).resolves.toStrictEqual({
      success: true,
      data: true,
    });

    await expect(client.getWatchMediaList().then((x) => x.json())).resolves.toHaveLength(1);
  });
});

async function readArtifact(fileName: string) {
  const dir = path.join(__dirname, "..", "tests", "artifacts");
  const filePath = path.join(dir, fileName);
  const buffer = await fs.readFile(filePath);
  const file = new File([buffer], fileName);
  return file;
}

async function readArtifactAsFormData(name: string, fileName: string) {
  const file = await readArtifact(fileName);
  return asFormData(name, file);
}

function asFormData(name: string, entry: FormDataEntryValue) {
  const formData = new FormData();
  formData.set(name, entry);
  return formData;
}

async function removePublicImages() {
  const dir = path.join(__dirname, "..", "public", "images");
  await fs.rm(dir, { force: true, recursive: true });
}

function throwUnreachable(): never {
  throw new Error("Unreachable");
}
