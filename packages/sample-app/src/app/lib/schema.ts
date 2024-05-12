import {
  object,
  string,
  boolean,
  optional,
  date,
  instance,
  picklist,
  toTrimmed,
  type Output,
} from "valibot";

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