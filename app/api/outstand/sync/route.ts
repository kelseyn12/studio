import { NextResponse } from "next/server";
import { fieldsFromSync } from "@/lib/account-sync";
import { listAccounts } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const accounts = await listAccounts();
  for (const account of accounts) {
    const existing = await prisma.socialAccount.findUnique({
      where: { outstandAccountId: account.id },
      select: { id: true },
    });
    const fields = fieldsFromSync(account, Boolean(existing));
    await prisma.socialAccount.upsert({
      where: { outstandAccountId: account.id },
      update: fields,
      create: { outstandAccountId: account.id, ...fieldsFromSync(account, false) },
    });
  }
  return NextResponse.redirect(new URL("/connections", request.url));
}
