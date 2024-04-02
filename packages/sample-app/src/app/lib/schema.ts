import {
  object,
  string,
  boolean,
  optional,
  date,
  instance,
  picklist,
  toTrimmed,
  parse as valibotParse,
  type BaseSchema,
  type Output,
} from "valibot";

if (!globalThis.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.File = require("node:buffer").File;
}

export const CreateWatchMediaSchema = object({
  title: string([toTrimmed()]),
  type: picklist(["movie", "series"]),
  watched: boolean(),
  releaseDate: date(),
  genres: instance(Set<string>),
  notes: optional(string([toTrimmed()])),
  image: instance(FormData),
});

export const DeleteWatchMediaSchema = object({
  mediaId: string(),
});

export const ToggleWatchMediaSchema = object({
  mediaId: string(),
  watched: boolean(),
});

export type CreateWatchMedia = Output<typeof CreateWatchMediaSchema>;

export type WatchMedia = Omit<CreateWatchMedia, "image"> & { id: string; imageUrl: string };

export function $valibot<S extends BaseSchema>(schema: S) {
  return {
    parse(value: unknown) {
      return valibotParse(schema, value);
    },
  };
}
