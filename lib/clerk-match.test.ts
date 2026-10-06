import { describe, expect, it } from "vitest";
import { pickStudioUser } from "@/lib/clerk-match";

const invite = {
  email: "Ayoubgu09@gmail.com",
  clerkId: null,
  createdAt: new Date("2026-10-06T13:19:39.000Z"),
};
const duplicate = {
  email: "ayoubgu09@gmail.com",
  clerkId: null as string | null,
  createdAt: new Date("2026-10-06T14:12:18.000Z"),
};

describe("pickStudioUser", () => {
  it("keeps the invite when Google lowercases the email", () => {
    expect(pickStudioUser([duplicate, invite], "user_new", "ayoubgu09@gmail.com")).toBe(invite);
  });

  it("uses the row already linked to this login", () => {
    const linked = { ...invite, clerkId: "user_new" };
    expect(pickStudioUser([duplicate, linked], "user_new", "ayoubgu09@gmail.com")).toBe(linked);
  });
});
