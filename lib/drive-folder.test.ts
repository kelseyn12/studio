import { describe, expect, it } from "vitest";
import { driveFolderId, finishedDriveFile, parseDriveFolderList } from "@/lib/drive-folder";

const html = `
<div class="flip-entry" id="entry-FOLDER1">
  <div aria-label="Folder"></div>
  <div class="flip-entry-title">B-Roll</div>
</div>
<div class="flip-entry" id="entry-FILE1">
  <div aria-label="MP4"></div>
  <div class="flip-entry-title">finished.mp4</div>
</div>
<div class="flip-entry" id="entry-FILE2">
  <div aria-label="MP4"></div>
  <div class="flip-entry-title">hook take.mp4</div>
</div>
`;

describe("drive folder", () => {
  it("reads a folder id and ignores a file link", () => {
    expect(driveFolderId("https://drive.google.com/drive/folders/abc123?usp=sharing")).toBe("abc123");
    expect(driveFolderId("https://drive.google.com/file/d/FILE/view")).toBeNull();
  });

  it("picks the video named finished and leaves the raw folders alone", () => {
    const entries = parseDriveFolderList(html);
    expect(entries.map((entry) => [entry.name, entry.folder])).toEqual([
      ["B-Roll", true],
      ["finished.mp4", false],
      ["hook take.mp4", false],
    ]);
    expect(finishedDriveFile(entries)?.id).toBe("FILE1");
    expect(finishedDriveFile([{ id: "a", name: "B-Roll", folder: true }])).toBeNull();
  });
});
