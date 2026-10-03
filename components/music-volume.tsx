"use client";

import { useState } from "react";
import { Slider } from "@/components/batch-controls";
import { MUSIC_LEVEL_HINTS, musicLevel } from "@/lib/output-recipe";

export function MusicVolume({ level, form }: { level: number; form?: string }) {
  const [value, setValue] = useState(musicLevel(level));
  return (
    <Slider
      name="musicLevel"
      form={form}
      label="Song under your voice"
      hint={MUSIC_LEVEL_HINTS[value]}
      value={value}
      max={MUSIC_LEVEL_HINTS.length - 1}
      onChange={setValue}
    />
  );
}
