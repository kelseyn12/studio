import { describe, expect, it } from "vitest";
import { viewCountFromWatchHtml, youtubeVideoId } from "@/lib/youtube-public";

describe("youtubeVideoId", () => {
  it("reads watch, shorts, and youtu.be links", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=nkaVTWbF5wI")).toBe("nkaVTWbF5wI");
    expect(youtubeVideoId("https://youtu.be/nkaVTWbF5wI")).toBe("nkaVTWbF5wI");
    expect(youtubeVideoId("https://www.youtube.com/shorts/nkaVTWbF5wI")).toBe("nkaVTWbF5wI");
    expect(youtubeVideoId("not a link")).toBeNull();
  });
});

describe("viewCountFromWatchHtml", () => {
  it("reads the public view count", () => {
    expect(viewCountFromWatchHtml('{"viewCount":"1258"}')).toBe(1258);
    expect(viewCountFromWatchHtml("<html></html>")).toBeNull();
  });
});
