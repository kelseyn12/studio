# System Studio

An operating system for running a high-volume UGC video business: plan videos, hand footage to an editor, turn one edit into many variations, schedule posts, and see which formats win.

Live: https://system-studio.fly.dev (sleeps when idle, first load takes a few seconds)

## Stack

- Next.js 15 (App Router, Turbopack) + React 19 + Tailwind 3
- Prisma 6 with `@prisma/adapter-libsql` → Turso (hosted SQLite). Local file fallback: `data/studio.db`
- Clerk auth (PIN fallback when Clerk keys are absent)
- Cloudflare R2 for video storage (local disk fallback)
- ffmpeg for cutting, trimming, variations and on-screen text
- Outstand for scheduling/publishing, OpenAI Whisper for transcription and spoken captions
- Fly.io host (shared-cpu-1x, 512MB, auto-stop)
- Vitest for tests

## Run it locally

```bash
pnpm install
cp .env.example .env        # fill in what you have; everything except DATABASE_URL is optional
pnpm db:push                # creates the local SQLite schema
pnpm dev                    # http://localhost:3000
```

With no Clerk keys, sign in with `STUDIO_PIN` from `.env`. The first user becomes CREATOR; later users are EDITOR.

On macOS the app prefers `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg` because Homebrew's default `ffmpeg` has no `drawtext` filter (needed for on-screen text). `brew install ffmpeg-full`.

## Tests

```bash
pnpm test
```

Includes real ffmpeg render tests, so ffmpeg must be installed.

## How the app is organised

Routes in `app/`:

| Route | What it is |
| --- | --- |
| `/` | Today: what to do next, setup checklist |
| `/pipeline` | Every video by stage (brief → footage → edit → ready → live) |
| `/cards/[id]` | One video: brief, footage, editor handoff, live post |
| `/campaigns` | Brand deals and the formats each deal uses |
| `/library` | Raw clips, grouped by deal |
| `/repurposer` | Multiply: hooks × bodies × CTAs → many videos, background render |
| `/edits` | Cuts: the editor's queue of videos to cut and send back |
| `/plan`, `/calendar` | Weekly plan and posting calendar |
| `/analytics` | Views per post, format scorecard |
| `/transcriber`, `/dms` | Whisper transcripts, ManyChat DMs |
| `/team`, `/connections` | Members and roles, Outstand connection |

Server actions live next to their route (`app/*/actions.ts`). Shared logic is in `lib/`, UI in `components/`. `lib/ffmpeg.ts`, `lib/variations.ts`, `lib/combinations.ts`, `lib/captions.ts` and `lib/render-batch.ts` are the core of Multiply.

Roles: CREATOR (owner), EDITOR (cuts videos), OPERATOR (schedules/posts). Auth is enforced in `middleware.ts` and `requireUser()` (`lib/auth.ts`).

## Deploy

```bash
flyctl deploy --remote-only \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$(grep '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' .env | cut -d= -f2- | tr -d '"')" \
  --build-arg CLERK_SECRET_KEY="$(grep '^CLERK_SECRET_KEY=' .env | cut -d= -f2- | tr -d '"')"
```

The Clerk keys must be passed as build args: `NEXT_PUBLIC_*` values are inlined into the client and middleware bundles at build time. A plain `fly deploy` builds without them and the live app silently falls back to the PIN login screen.

`Dockerfile` builds with a throwaway SQLite file; at runtime the app reads `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from Fly secrets so local and Fly share one database. Schema changes need `pnpm db:push` locally and the matching `ALTER TABLE` on Turso (`turso db shell studio`).

Heavy Multiply batches are meant to run on a Mac, not on the 512MB Fly machine.

## Docs

`guidelines/` holds the conventions, file map, method glossary, refactoring log and to-do list. Start with `guidelines/file-system-map.md`.
