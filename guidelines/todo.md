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

- [X] Editor desk is a slice, not the whole studio
  Add them on Team as Editor. Assign on the card. They only see CapCut in and their jobs.

- [X] One path: Plan month → make file → Live
  Base44 put publish time on every card step and then had a second calendar.
  Cards are now Brief / Footage / Editor / Live. Only Live ships. Today is one next step.

- [X] Today holds money, both deal types, and the handoff
  Canvas/tech and traditional UGC are one Deals room with a kind. Numbers stays real.
  Send to editor lands on CapCut in. Default editor is set on Team.
