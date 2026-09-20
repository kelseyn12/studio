# To-do

- [X] Scaffold studio app, schema, ADHD shell
  First cut of System Studio is in the repo: pipeline cards, deals, calendars, editor handoff, Outstand hooks.
  Today picks one next action so the creator is not staring at a dashboard.

- [X] Pipeline, campaigns, calendars, card handoff
  Cards carry script, reference, raws, voice note, deadline, and schedule.
  Deals score hourly rate and daily slots, not just base pay.

- [X] Outstand key + org id in `.env`
  @kelseynocekugc synced. Connect new campaign accounts on Accounts, then Sync. Never commit `.env`.

- [ ] Clerk or managed auth for production
  Studio PIN is a local lock so the machine can run today.
  Replace it before this is on the public internet.

- [ ] Outstand webhooks for publish + analytics
  Polling can wait. Wire `post.published` when the key is in.

- [X] Clarify repurposer: mixes vs unique copies
  Hooks × bodies × CTAs is the story mix. Variants change speed/light/crop per copy.
  Live math updates as you change unique copies. Today starts at clips, not a deal.

- [X] Volume pass: repurposer, library, bulk calendar, calmer palette
  Hooks × demos × CTAs now keep audio, optional music, hook text, and land as Ready cards.
  Skipped students and an in-app editor. CapCut stays the cutter.

- [X] Repurposer rows + mix settings + editor packet
  Clips are labeled by the row you drop them in. Mix settings sit on the same batch page.
  CapCut cards now show a missing-packet list. ffmpeg exports at CRF 18.

- [X] Ship through Outstand from Calendar
  Generate stays on this Mac. Calendar uploads the mp4 to Outstand and schedules it.
  No extra host. Media lives 60 days on Outstand.
