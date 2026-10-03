"use client";

import { useState } from "react";
import { Slider } from "@/components/batch-controls";
import { MUSIC_LEVEL_MAX, musicLevel, musicLevelHint } from "@/lib/output-recipe";

export function MusicVolume({ level, form }: { level: number; form?: string }) {
  const [value, setValue] = useState(musicLevel(level));
  return (
    <Slider
      name="musicLevel"
      form={form}
      label="Song under your voice"
      hint={musicLevelHint(value)}
      value={value}
      max={MUSIC_LEVEL_MAX}
      onChange={setValue}
    />
  );
}
