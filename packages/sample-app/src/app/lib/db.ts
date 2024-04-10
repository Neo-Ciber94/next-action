import { type WatchMedia } from "./schema";

const globalThisWithDb = globalThis as { __DB?: Map<string, WatchMedia> };

function getOrInitDb() {
  if (!globalThisWithDb.__DB) {
    globalThisWithDb.__DB = new Map<string, WatchMedia>();

    if (!process.env.NO_SEED_DATABASE) {
      globalThisWithDb.__DB = new Map<string, WatchMedia>([
        [
          "1",
          {
            id: "1",
            title: "Pulp Fiction",
            type: "movie",
            watched: true,
            releaseDate: new Date("1994-10-14"),
            genres: new Set(["Crime", "Drama"]),
            imageUrl:
              "https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            notes: "Quentin Tarantino's iconic crime drama with intersecting storylines.",
          },
        ],
        [
          "2",
          {
            id: "2",
            title: "Inception",
            type: "movie",
            watched: true,
            releaseDate: new Date("2010-07-16"),
            genres: new Set(["Action", "Adventure", "Sci-Fi"]),
            imageUrl:
              "https://image.tmdb.org/t/p/w600_and_h900_bestv2/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            notes: "Mind-bending sci-fi thriller directed by Christopher Nolan.",
          },
        ],
        [
          "3",
          {
            id: "3",
            title: "Attack on Titan",
            type: "series",
            watched: true,
            releaseDate: new Date("2013-04-07"),
            genres: new Set(["Action", "Fantasy", "Drama"]),
            imageUrl:
              "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7PzZ3amc7hNJi0CiMcwC4BhoWKL.jpg",
            notes:
              "An engrossing anime series that delves into complex themes of survival, human nature, and the cost of war. 'Attack on Titan' presents a dark and intense narrative set in a world besieged by monstrous giants. The animation is striking, and the storyline is both profound and thought-provoking.",
          },
        ],
      ]);
    }
  }

  return globalThisWithDb.__DB;
}

export const DB = {
  get data() {
    return getOrInitDb();
  },
  destroy() {
    delete globalThisWithDb.__DB;
  },
};
