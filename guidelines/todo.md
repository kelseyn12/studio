# To-do

- [X] Scaffold studio app, schema, ADHD shell
  First cut of System Studio is in the repo: pipeline cards, deals, calendars, editor handoff, Outstand hooks.
  Today picks one next action so the creator is not staring at a dashboard.

- [X] Pipeline, campaigns, calendars, card handoff
  Cards carry script, reference, raws, voice note, deadline, and schedule.
  Deals score hourly rate and daily slots, not just base pay.

- [X] Outstand key + org id in `.env`
  @kelseynocekugc synced. Connect new campaign accounts on Accounts, then Sync. Never commit `.env`.

- [X] Posting calendar parks and ships
  Week / month / scheduled / posted. Add slot on a day, or auto-space the batch.
  Each slot picks the account and time, then `queueCard` ships through Outstand.

- [X] Whisper + ManyChat in the loop
  Voice on the card becomes the editor note. DMs store comment recipes. Optional pings when a job is sent.

- [X] Outstand publish + analytics close the loop
  Pull from Outstand marks Posted/Data. Film dates stay on Plan. Winning hooks Multiply.

- [X] Clerk or managed auth for production
  Clerk keys turn PIN off. Team invite emails the VA. Cuts is their only room. Fly.io hosts the public URL; the machine sleeps when idle so it stays cheap.
  Self-cut still works on this laptop with PIN until those keys exist. A remote editor does not.

- [X] Self-cut vs VA
  Footage: I’ll cut this (`cutBy=SELF`) or Send to editor (`cutBy=EDITOR`). Today says Cut N vs Send N. SELF never pings ManyChat.

- [X] Clarify repurposer: mixes vs unique copies
  Hooks × bodies × CTAs is the story mix. Variants change speed/light/crop per copy.
  Live math updates as you change unique copies. Today starts at clips, not a deal.

- [X] Volume pass: repurposer, library, bulk calendar, calmer palette
  Hooks × demos × CTAs now keep audio, optional music, hook text, and land as Ready cards.
  Skipped students and an in-app NLE. They cut in their own editor. Studio takes the 1080.

- [X] Repurposer rows + mix settings + editor packet
  Clips are labeled by the row you drop them in. Mix settings sit on the same batch page.
  Cuts cards now show a missing-packet list. ffmpeg exports at CRF 18.

- [X] Editor desk is a slice, not the whole studio
  Add them on Team as Editor. Assign on the card. They only see Cuts and their jobs.

- [X] One path: Plan month → make file → Live
  Base44 put publish time on every card step and then had a second calendar.
  Cards are now Brief / Footage / Editor / Live. Only Live ships. Today is one next step.

- [X] Today holds money, both deal types, and the handoff
  Canvas/tech and traditional UGC are one Deals room with a kind. Numbers stays real.
  Send to editor lands on Cuts. Default editor is set on Team.

- [X] Full 20k machine loop
  Accounts opens Outstand. Plan month drags film dates. Brief rewrites hooks and stores editor deadline.
  Today chases due-in-2-days. Numbers pulls Outstand stats. DMs opens ManyChat. ChatGPT Plus is not the API.

- [X] Brief generates a spoken script from references
  Generate script fills hook/body/plug/script. Short reference clips (under 40MB) get transcribed plus one still. 4K days stay in Drive.

- [X] Transcribe URL, Looks good, shuffle mixes, drop voice
  Transcribe pulls TikTok/Reel/YouTube via yt-dlp or a direct mp4. Looks good parks the cut in Library without a Live time. Multiply shuffles when not every mix. Footage accepts a voice file.

- [X] Studio file cap and Library cleanup
  Drops over 250MB are refused. Library shows finished, raws, voice, and Drive folders. Posted raws can be deleted in one click. Today yells only when files pass 8 of 10 GB.

- [X] Library groups finished videos by deal
  Finished mixes sit under the deal name. Generate requires Post as, then opens Live so you auto-space the week.

- [X] R2 keys in `.env`
  Account, bucket, token, and public URL are set. New drops go to the cloud instead of this Mac. Never commit `.env`.

- [X] Public URL on Fly (sleeps when idle)
  https://system-studio.fly.dev — Clerk sign-in, no PIN. Editor is Cuts only. Invite from Team.

- [X] Needs changes on Live
  From To approve, write what to fix. Job goes back to Cuts. Editor sees the note and drops a new finished video.

- [X] Delete a video from Film days
  × on the chip or Delete this video on the video page. Files leave R2 too.

- [X] Multiply music is random per video
  Drop several songs. Each file picks one, uses the whole list before repeating. One song = every file gets it. Voice stays loud.

- [X] Text hooks + mirror in Multiply
  Text hooks: one line each, burned bold top-center on clip 1, multiplies the batch (6 mixes × 4 lines = 24). Mirror flips every second copy.

- [X] Money closes: Got paid? button
  On Live posted list and the video page. Flips approved so Collected on Today counts real dollars. Tap again to undo.

- [X] Failed posts visible on Live
  Outstand rejections now write a FAILED job. Live shows who did not post, why, with Try again and Clear.

- [X] Multiply batch caption + dead-air trim
  Caption box ships with every video in the batch (no more file-name captions). Cut dead air toggle trims silent clip ends with ffmpeg silencedetect, never below half a second.

- [X] Storage meter tells the truth
  Generated videos record real file size. Multiply clips and music count in the 10 GB meter via studioBytes.

- [X] Deals editable + delivered bar
  Edit this deal on the deal page (pay, promised videos, slots, status). Delivered X / promised with a progress bar.

- [X] One database (Turso) so this Mac and fly.dev stop diverging
  studio db on Turso free plan (aws-us-east-1), seeded from the local file. Both places read/write it via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
  Schema changes now need two steps: prisma db push (local file for the CLI) AND the same SQL applied with turso db shell studio.

- [X] CPM money in the totals
  Every posted video earns payout + views/1000 × the deal's CPM. Collected still waits for Got paid?; Waiting shows the rest.

- [X] Numbers looks like a real dashboard
  Collected, Waiting, both deal kinds, Views, Posted, Likes, Engagement %. Top videos with Multiply. Top accounts with posts + views.

- [X] Polish loop for generated videos
  Ready + unscheduled videos get Send to editor to polish on Live. Editor sees it on Cuts with the note, drops a fixed video, it returns To approve.

- [X] Ship the newest cut
  queueCard and the video page now pick the newest editor cut over older files. Revisions actually post now.

- [X] Quick cut inside Studio
  Trim on any Multiply clip tile: play, Start here, End here, Cut it — replaces the clip so every video built from it uses the cut. Same tool on Live for finished videos (makes a new cut; newest ships). Files stream with byte ranges so scrubbing works.

- [X] Background render with progress for big Multiply batches
  Generate returns immediately. Progress bar on the batch page. Run big batches on this Mac, not Fly (512MB).

- [X] Volume without bloat
  Editor cut drops the unused Multiply looks immediately. Posted files (and unused batch clips) drop after 14 days; the video and its numbers stay. Pipeline hides Posted/Data. Library has Free space. Paying past 10 GB R2 is fine.

- [X] Cross-post per deal
  Each account gets a deal on Accounts. Deal videos post to every account on the deal (Polsia → IG + FB, Morphi → IG + TT + YT + FB). Multiply no longer needs a single account when the deal has some.

- [X] Native look on every app when cross-posting
  A deal on IG + TT gets each video built twice — Instagram look and TikTok look — and each file posts to its own accounts as its own Outstand post. Editor cuts ship everywhere as-is. Numbers sums the posts.

- [X] Text hooks in the platform's own look
  Text look on Mix settings: TikTok / Instagram / Plain, default follows the account. Hooks wrap to two lines. Nickolai/Sasha style stays burned in; native in-app text is not possible through scheduling.

- [X] Sasha frame: highlighted word, numbered list, colored rooms
  Hook text now renders through libass (lib/ass.ts): *stars* around a word color it (green/red/yellow/blue cycle with "Text color changes per copy"), "Numbered list under the headline" puts 1.–N. down the left, "Color wash per copy" tints each copy red/blue/purple/magenta/orange/teal. TikTok look (outline + shadow) and Instagram look (box per line) both render; cross-post deals still get one file per look. Real-render pixel tests in lib/ass.test.ts.

- [X] 4K phone clips into Multiply
  Found and fixed: every upload over 10MB was 500ing (Next middleware body cap). Cap is now 1GB on the Mac, 250MB on Fly. 4K clips shrink to 1080 on arrival; non-video files are refused at upload.

- [X] Send a whole Multiply batch to the editor
  "Send all to editor to polish" on the batch page moves every Ready, unscheduled output to Cuts with one note. Per-video state shown next to each output.

- [X] Spoken words on screen in Multiply
  Toggle on Mix settings. Whisper timestamps → 2–3 word phrases burned through the whole video. Cached per clip. Needs ffmpeg-full + OPENAI_API_KEY.
