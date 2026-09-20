import type { PacketItem } from "@/lib/editor-packet";

export function EditorNeed({ items }: { items: PacketItem[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item) => (
        <li key={item.label} className={item.ok ? "text-mute" : "text-sun"}>
          {item.ok ? "Ready · " : "Missing · "}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
