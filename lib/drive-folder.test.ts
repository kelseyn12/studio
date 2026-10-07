import { describe, expect, it } from "vitest";
import { driveFolderId, finishedDriveFile, parseDriveFolderList } from "@/lib/drive-folder";

const html = `
<div class="flip-entry" id="entry-FOLDER1">
  <div aria-label="Folder"></div>
  <div class="flip-entry-title">B-Roll</div>
  <div class="flip-entry-last-modified"><div>Oct 6</div></div>
</div>
<div class="flip-entry" id="entry-FILE1">
  <div aria-label="MP4"></div>
  <div class="flip-entry-title">finished.mp4</div>
  <div class="flip-entry-last-modified"><div>Oct 6</div></div>
</div>
<div class="flip-entry" id="entry-FILE2">
  <div aria-label="MP4"></div>
  <div class="flip-entry-title">hook take.mp4</div>
  <div class="flip-entry-last-modified"><div>Oct 7</div></div>
</div>
`;

describe("drive folder", () => {
  it("reads a folder id and ignores a file link", () => {
    expect(driveFolderId("https://drive.google.com/drive/folders/abc123?usp=sharing")).toBe("abc123");
    expect(driveFolderId("https://drive.google.com/file/d/FILE/view")).toBeNull();
  });

  it("picks the newest video and leaves the raw folders alone", () => {
    const entries = parseDriveFolderList(html);
    expect(entries.map((entry) => [entry.name, entry.folder])).toEqual([
      ["B-Roll", true],
      ["finished.mp4", false],
      ["hook take.mp4", false],
    ]);
    expect(finishedDriveFile(entries, new Date("2026-10-07T12:00:00Z"))?.id).toBe("FILE2");
    expect(finishedDriveFile([{ id: "a", name: "B-Roll", folder: true, modified: "" }])).toBeNull();
  });

  it("sees a video row that has no folder label", () => {
    const live = `
      <div class="flip-entry" id="entry-FOLDER1"><a href="https://drive.google.com/drive/folders/FOLDER1"><div aria-label="Folder"></div><div class="flip-entry-title">B-Roll</div></a><div class="flip-entry-last-modified"><div>Oct 6</div></div></div>
      <div class="flip-entry" id="entry-FILE9"><a href="https://drive.google.com/file/d/FILE9/view"><img alt="Video"/><div class="flip-entry-title">my cut.mov</div></a><div class="flip-entry-last-modified"><div>Oct 7</div></div></div>
    `;
    const entries = parseDriveFolderList(live);
    expect(entries.map((entry) => [entry.id, entry.name, entry.folder])).toEqual([
      ["FOLDER1", "B-Roll", true],
      ["FILE9", "my cut.mov", false],
    ]);
    expect(finishedDriveFile(entries, new Date("2026-10-07T12:00:00Z"))?.id).toBe("FILE9");
  });
});
