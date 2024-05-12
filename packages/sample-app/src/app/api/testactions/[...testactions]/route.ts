import {
  deleteAllWatchMedia,
  createWatchMedia,
  deleteWatchMedia,
  getWatchMediaList,
  toggleWatched,
} from "@/app/lib/actions";
import { exposeServerActions } from "next-action/testing/server";

const testActions = exposeServerActions({
  endpoint: "/api/testactions",
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
