"use client";

/** On/off pill used across Mix settings. Posts `name=on` only when on. */
export function Toggle({
  name,
  on,
  onChange,
}: {
  name: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <>
      {on ? <input type="hidden" name={name} value="on" /> : null}
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold ${on ? "bg-sun text-ink" : "bg-lift text-mute"}`}
      >
        {on ? "On" : "Off"}
      </button>
    </>
  );
}

export function Slider({
  name,
  label,
  hint,
  value,
  max,
  onChange,
  form,
}: {
  name: string;
  label: string;
  hint: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  form?: string;
}) {
  return (
    <div className="border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-mute">{hint}</p>
      </div>
      <input
        name={name}
        form={form}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-sun"
      />
    </div>
  );
}
