import {
  deleteAllWatchMedia,
  createWatchMedia,
  deleteWatchMedia,
  getWatchMediaList,
  toggleWatched,
} from "@/app/lib/api";
import { exposeServerActions } from "next-action/testing/server";

const testActions = exposeServerActions({
  actions: {
    getWatchMediaList,
    createWatchMedia,
    toggleWatched,
    deleteWatchMedia,
    deleteAllWatchMedia,
  },
});

export type TestActions = typeof testActions.actions;

export const POST = testActions;
