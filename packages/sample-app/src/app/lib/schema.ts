import {
  object,
  string,
  boolean,
  Output,
  optional,
  date,
  instance,
  picklist,
  toTrimmed,
  mimeType,
  BaseSchema,
  parse as valibotParse,
} from "valibot";

if (!globalThis.File) {
  globalThis.File = require("node:buffer").File;
}

export const CreateWatchMediaSchema = object({
  title: string([toTrimmed()]),
  type: picklist(["movie", "series"]),
  watched: boolean(),
  releaseDate: date(),
  genres: instance(Set<string>),
  notes: optional(string([toTrimmed()])),
  image: instance(File, [mimeType(["image/*"])]),
});

export const DeleteWatchMediaSchema = object({
  mediaId: string(),
});

export const ToggleWatchMediaSchema = object({
  mediaId: string(),
  watched: boolean(),
});

export type CreateMedia = Output<typeof CreateWatchMediaSchema>;

export type WatchMedia = Omit<CreateMedia, "image"> & { id: string; imageUrl: string };

export function $valibot<S extends BaseSchema>(schema: S) {
  return {
    parse(value: unknown) {
      return valibotParse(schema, value);
    },
  };
}
