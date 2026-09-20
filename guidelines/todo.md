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
  Clerk keys turn PIN off. Team invite emails the VA. Cuts is their only room. Fly.io hosts the always-on URL with a disk volume.
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
