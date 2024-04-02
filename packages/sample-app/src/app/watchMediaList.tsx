"use client";
import React, { useState } from "react";
import { deleteWatchMedia, toggleWatched, createWatchMedia } from "@/app/lib/api";
import type { WatchMedia, CreateWatchMedia } from "@/app/lib/schema";

const today = new Date();

const DEFAULT: Partial<CreateWatchMedia> = {
  title: "",
  releaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  genres: new Set(),
  type: "movie",
  watched: false,
  notes: "",
  image: undefined, // Assume image is a File object
};

export default function WatchMediaList({ watchMediaList }: { watchMediaList: WatchMedia[] }) {
  const [watchMedia, setWatchMedia] = useState<Partial<CreateWatchMedia>>(() =>
    structuredClone(DEFAULT),
  );
  const [error, setError] = useState<string>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setWatchMedia((prevWatchMedia) => ({
        ...prevWatchMedia,
        image: (() => {
          const f = new FormData();
          f.set("image", files[0]);
          return f;
        })(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    try {
      const result = await createWatchMedia(watchMedia as CreateWatchMedia);

      console.log(result);
      if (result.success) {
        setWatchMedia(() => structuredClone(DEFAULT));
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="p-4 rounded-lg shadow-md border min-w-[95%] sm:min-w-[600px]">
        <h1 className="text-3xl font-bold mb-4 text-center text-neutral-600">Watch Media List</h1>
        <div className="mb-4">
          <h2 className="text-xl font-bold my-2">Add New Media</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={watchMedia.title}
                className="block w-full p-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                onChange={(e) => {
                  setWatchMedia((prev) => ({ ...prev, title: e.target.value }));
                }}
              />
            </div>
            <div>
              <input
                type="date"
                name="releaseDate"
                className="block w-full p-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                value={
                  watchMedia.releaseDate ? watchMedia.releaseDate.toISOString().split("T")[0] : ""
                }
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value + "T00:00:00.000Z");
                  setWatchMedia((prev) => ({ ...prev, releaseDate: selectedDate }));
                }}
              />
            </div>
            <div>
              <select
                name="type"
                value={watchMedia.type}
                className="block w-full p-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                onChange={(e) => {
                  setWatchMedia((prev) => ({
                    ...prev,
                    type: e.target.value as CreateWatchMedia["type"],
                  }));
                }}
              >
                <option value="movie">Movie</option>
                <option value="series">Serie</option>
              </select>
            </div>
            <div>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full p-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <textarea
                name="notes"
                placeholder="Notes"
                value={watchMedia.notes}
                rows={4}
                className="block w-full p-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onChange={(e) => {
                  setWatchMedia((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                }}
              />
            </div>

            {error && <p className="py-2 text-red-600 italic">{error}</p>}

            <div>
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Add Media
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2 text-center">Media List</h2>
          {watchMediaList.length === 0 && (
            <h1 className="text-center p-4 text-2xl text-neutral-500/20">Nothing here</h1>
          )}
          <ul className="flex flex-col gap-2">
            {watchMediaList.map((media) => (
              <li key={media.id} className="shadow border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-row gap-4">
                    <img
                      src={media.imageUrl}
                      alt={media.title}
                      className="w-28 h-28 rounded-md object-cover"
                    />
                    <div className="flex flex-col">
                      <p>
                        <span className="font-semibold">Title:</span>{" "}
                        <span className="text-neutral-500">{media.title}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Release Date:</span>{" "}
                        <span className="text-neutral-500">{media.releaseDate.toDateString()}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Type:</span>{" "}
                        <span className="text-neutral-500">{media.type}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Notes:</span>{" "}
                        <span className="text-neutral-500">{media.notes}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <form action={deleteWatchMedia}>
                      <input type="hidden" name="mediaId" value={media.id} />
                      <button
                        type="submit"
                        className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded min-w-36"
                      >
                        Delete
                      </button>
                    </form>
                    <button
                      className={`mt-4 min-w-36 text-white font-semibold py-2 px-4 rounded ${
                        media.watched
                          ? "bg-gray-500 hover:bg-gray-700"
                          : "bg-green-500 hover:bg-green-700"
                      }`}
                      onClick={async () => {
                        await toggleWatched({ mediaId: media.id, watched: !media.watched });
                      }}
                    >
                      {media.watched ? "No Watched" : "Watched"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
