import { NextResponse } from "next/server";
import { listAccounts } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const accounts = await listAccounts();
  for (const account of accounts) {
    await prisma.socialAccount.upsert({
      where: { outstandAccountId: account.id },
      update: {
        username: account.username,
        network: account.network,
        nickname: account.nickname || "",
        isActive: Boolean(account.isActive ?? true),
      },
      create: {
        outstandAccountId: account.id,
        username: account.username,
        network: account.network,
        nickname: account.nickname || "",
        isActive: Boolean(account.isActive ?? true),
      },
    });
  }
  return NextResponse.redirect(new URL("/connections", request.url));
}
