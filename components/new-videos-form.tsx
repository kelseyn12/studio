"use client";

import { useState } from "react";
import { titlesForCount } from "@/lib/new-videos";
import { VideoPlaceSelect } from "@/components/video-place";

export function NewVideosForm({
  action,
  deals,
}: {
  action: (formData: FormData) => void;
  deals: Array<{ id: string; label: string }>;
}) {
  const [titles, setTitles] = useState<string[]>([""]);

  function setCount(raw: string) {
    setTitles((current) => titlesForCount(current, Number(raw)));
  }

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <VideoPlaceSelect deals={deals} />
      <label>
        <span className="label">Film day</span>
        <span className="mb-1 block text-xs font-normal text-mute">Leave blank. This is only for videos you still have to film.</span>
        <input name="plannedDate" type="date" className="field" />
      </label>
      <label>
        <span className="label">How many</span>
        <input
          name="count"
          type="number"
          min={1}
          max={40}
          value={titles.length}
          onChange={(event) => setCount(event.target.value)}
          className="field"
        />
      </label>
      {titles.map((title, index) => (
        <label key={index}>
          <span className="label">{titles.length === 1 ? "Title" : `Video ${index + 1}`}</span>
          <input
            name="title"
            required
            value={title}
            placeholder={titles.length === 1 ? "Title" : `Name for video ${index + 1}`}
            onChange={(event) =>
              setTitles((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
            }
            className="field"
          />
        </label>
      ))}
      <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">
        {titles.length === 1 ? "Create video" : `Create ${titles.length} videos`}
      </button>
    </form>
  );
}
