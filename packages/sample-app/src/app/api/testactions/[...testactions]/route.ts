import {
  createWatchMedia,
  deleteWatchMedia,
  getWatchMediaList,
  toggleWatched,
} from "@/app/lib/api";
import { exposeServerActions } from "next-action/testing/server";

const testActions = exposeServerActions({
  getWatchMediaList,
  createWatchMedia,
  toggleWatched,
  deleteWatchMedia,
});

export type TestActions = typeof testActions.actions;

export const POST = testActions;
