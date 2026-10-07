# To-do

- [X] Finished file in the Drive folder
  He puts the cut in the same folder as the raw clips. Any file name is fine.
  He pastes a Drive link to the video, or to a folder with the video in it. Her folder or one he made. The job tells him to make that link public. The download streams to disk so the button can finish. Opening Today, Cuts, or the job still checks her folder.

- [X] Discord only when work changes hands
  Sending him a job or a polish pings him. His finished drop pings you.
  Your own drop, Schedule, and notes stay quiet.

- [X] One video, every account
  A self-cut with one file shows that file once and lists IG, FB, TikTok, and YouTube.
  Approve stays for his cut. Hers goes straight to Schedule.

- [X] Start cutting button
  The job stays in To cut until he presses Start cutting. The voice note is at the top.
  He can paste a CapCut project link on the job. Drive raw footage is labeled as raw footage.

- [X] To cut until he downloads
  Send leaves the card in To cut. His download or Open 4K folder moves it to Cutting.
  One video is the finished-file choice. A Drive file link works. A folder does not.

- [X] See his Cuts page
  My page / his page on Cuts and on the video. His page uses his list names and, when the video is his, the job sheet.
  A video he does not have stays on your page with a line saying so.

- [X] Send to editor sends once
  Clips Send to editor hands him the video and opens Cuts. It was opening the Cut tab instead.
  Clicking it again does not ping him a second time.

- [X] Delete a voice note
  Delete on the voice player removes that file. The Voice paragraph goes too when it was the last one.
  Record a voice note starts a fresh take.

- [X] Redo a voice note
  Record again replaces the last voice-note file and the Voice paragraph on the note.
  A note typed above that paragraph stays.

- [X] Voice note shows that it is recording
  The button says Stop recording, with a countdown, while the mic is open.
  It still stops itself after 20 seconds and saves the note.

- [X] Clips remembers the editor on Save
  Picking Tarikh and clicking Save reloads Clips with him still selected.
  The menu uses the person saved on the video before anyone marked default.

- [X] Several reference links, each with a note
  Write holds a link and a note, and Add another reference. The editor sees each one on the job.
  The old single link still shows when the list is empty.

- [X] See if the editor signed in
  Team shows "Has not signed in" until they open Studio. After that it shows the day they last did.
  `readClerkSession` writes `User.lastSeenAt`. Laptop PIN logins stay blank.

- [X] Pull posts made in the apps
  A deal page button imports that deal's accounts since a date. Posts Studio already sent are skipped.
  New posts become posted videos with their caption, link, and view count, so Numbers includes them.

- [X] Editor batches: clean videos + the words, in folders
  Multiply "Draw the words on the video" off → one clean file per mix; hook, body, CTA saved on the card for the editor.
  Cuts groups batch videos into a folder per Multiply name: words per mix, Needs IG · FB + TT · YT, Download all, drop many files named "mix 2 IG.mp4".

- [X] Editor guide
  `guidelines/editor-guide.md` — sign in, folders, Hook / Body / CTA, one file or two, naming `mix 2 IG.mp4`, drop back.
  The single video page's Download files now lists the clean Multiply video too.

- [ ] Verify editor folders in the browser
  Sign in, open Cuts and a Multiply batch, confirm the toggle and the folder drop. The Clerk session had expired when this was built.

- [X] Waiting videos sit in a folder
  Live groups finished videos with no day under the Multiply name you typed.
  Each mix opens on its own. The file name is not the folder name.

- [X] Blank caption, and update a scheduled caption
  An empty caption box posts with no caption. The file name is not used.
  Update caption for scheduled post changes the waiting post and does not send a second one.

- [X] A scheduled video cannot be sent twice
  Every schedule path claims the day inside `queueCard`. A second press creates no Outstand post.
  A failed app can still be sent again. The extra Monday queue for the afternoon double was cancelled.

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
  Hooks × bodies × CTAs is the story mix. Distinct is another filmed hook or body, not a sat/speed copy. Copies stay at 1 unless you post that exact cut twice. `mixStoryNote` spells both layouts (1 hook × 3 bodies, 3 hooks × 1 body).

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
  The box starts empty. The fix sits on top of his job; the first brief stays under it.

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

- [X] Show which app rejected a post that already went out
  Live reads each queued Outstand post and marks Instagram, Facebook, or YouTube failed. Try again sends only those apps, so TikTok is not posted twice.

- [X] Calendar says Posted once an app is live
  The day chip and the video's last step say Posted. A failed app other than YouTube is retried once on its own. A YouTube cap miss says "YouTube did not post" on Today and on the day.

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
  Text look on Mix settings: Match the accounts, Both looks, TikTok only, Instagram only, Plain. Both (or auto on an IG+TT deal) builds two files. Hooks wrap to two lines. Native in-app text is not possible through scheduling.

- [X] Full-app audit (Sep 26)
  Owner + editor page sweep, API auth probes, real-clip render with the new options, lint clean, ffmpeg.ts split. Nothing broken found.

- [X] Caption per hook + spoken words match the file look
  Each hook clip has its own post caption. Spoken words on screen use TikTok or Instagram text style to match that file.

- [X] Watch uses Studio files, not the R2 S3 URL
  Clicking Watch opened `*.r2.cloudflarestorage.com` and showed an empty XML error. Players and Download now use `/api/files`.

- [X] Check multiple accounts on Multiply / Live
  Cross-post without assigning the deal first: check IG + TT (or put them on the deal in Accounts).

- [X] Color wash removed
  The fake full-frame tint looked plastic. Colored rooms come from an LED at filming. Mix settings no longer has a wash slider. Starred words and the numbered list stay.

- [X] Sasha frame: highlighted word, numbered list
  Hook text renders through libass (lib/ass.ts): *stars* around a word color it (green/red/yellow/blue cycle with "Text color changes per copy"), "Numbered list under the headline" puts 1.–N. down the left. TikTok look (outline + shadow) and Instagram look (box per line) both render; cross-post deals still get one file per look. Real-render pixel tests in lib/ass.test.ts.

- [X] 4K phone clips into Multiply
  Found and fixed: every upload over 10MB was 500ing (Next middleware body cap). Cap is now 1GB on the Mac, 250MB on Fly. 4K clips shrink to 1080 on arrival; non-video files are refused at upload.

- [X] Send a whole Multiply batch to the editor
  "Send all to editor to polish" on the batch page moves every Ready, unscheduled output to Cuts with one note. Per-video state shown next to each output.

- [X] Spoken words on screen in Multiply
  Toggle on Mix settings. Whisper timestamps → 2–3 word phrases burned through the whole video. Cached per clip. Needs ffmpeg-full + OPENAI_API_KEY.

- [X] Select all + delete generated videos
  Library Finished and the Multiply output list have Select all / Delete selected. One click marks every video; delete removes the cards, files, and batch rows.

- [X] Cut dragging parts and speed a video in Studio
  Live (and Multiply clip tiles) can drop one or more middle sections and speed 1.25× / 1.5× / 2×. Save cut writes a new file; schedule it on Live — no editor or download.

- [X] Logos on the first beat of a hook
  Drop PNG/JPG on a hook clip. They show for 2.5s. Three files layout as A + B = C. Generate burns them in.

- [X] Place words on the hook, undo cuts, fix 2×, pick covers
  Words button types on the clip and drags (TT/IG look still burns through libass). Logos drag too. Undo last cut. 2× is actually faster than 1.25×. Copies keep speed/hue; each copy and Live can pick a cover frame.

- [X] Speed pills write a real 2× file
  Dropped fps/-r after setpts and the 4K playbackRate preview (2× looked slower than 1.25×). Save cut encodes `setpts`+`atempo`, then plays that file at 1×. Video and audio durations match in lib/cut.test.ts.

- [X] 1× is recorded speed
  After a sped save, 1 was playing the sped file and sounded fast. Preview and encode stay on the original (`basePath`). 1 is normal; 1.25 / 1.5 / 2 go up from there.

- [X] Mini edit on every clip
  Precise drag + TT/IG preview. Cut track. Words/cut/speed on bodies and CTAs. Type list lines on the clip. Logos default to a row; A + B = C is optional. Text can start/end mid-clip. Four apps still share two looks (IG+FB / TT+YT).

- [X] Words timing, multi-cut, formula logos
  Words do not hear speech — Show text now / Hide text after now is a clock window; Spoken words in Mix follows talking. Logos accept +, =, emoji, and a short chip next to files. Yellow track ends trim; Cut from/to drops each middle and can be repeated.

- [X] Logo chips easier to drag
  New chips start in a top row (not on the play button). Words preview is wider. Pads are larger, sit above the text layer, and keep pointer capture so the video/words do not steal the drag.

- [X] Logo chips have no white boxes
  The rounded white borders were only the Words grab handle. Preview is now the logo / + / = / emoji with no pill. Generate never drew those boxes.

- [X] Bigger / Smaller logos
  Each chip stores `scale`. Tap it on Words, then Bigger or Smaller (0.5×–2.5×). Preview and the burned sheet both use that size.

- [X] Bigger hook type + Sasha list clocks
  Headline is TT 88 / IG 80. Numbers stay from the first frame. Type the points, scrub, tap This line now for each one (`listAt` in hookLayout). Studio still does not hear the list.

- [X] IG-native Sasha, body list, Align
  Instagram is outline stroke like Sasha Reels. List can live on the body (ASS without a headline). Align evens the logo row and centers Words. This line now fills each body line as you say it.

- [X] Native TT/IG Words, shared list rows, Box toggle
  TikTok Classic 82 / Reels Classic 76. Mix numbers stay on the hook; body words use the same stack. Box on/off is a plate behind Words on hook, body, and CTA.

- [X] Native black/white boxes + Align guides
  Box on is solid black + white type: TT rounded chip, IG tight block. Align shows the center line and shared axes; it does not reshuffle logos.

- [X] Per-line native boxes + Match type
  Box was one wide slab on the textarea. Preview is now a hugging chip per wrap (TT pill, IG block). Burn-in is one ASS plate per line. Match type sizes a logo to the look; Bigger/Smaller still nudge.

- [X] Native faces on Words
  TT burns and previews in TikTok Sans (OFL). IG uses Inter Tight — Instagram Sans is not licensed to bundle. Spoken captions use the same files.

- [X] White box + spoken-word fix
  Box cycles Off / Black / White. Spoken phrases can be rewritten on the clip; Wipe listens again on the next Generate.

- [X] CapCut-style spoken captions
  Spoken on burns lower-third white + black outline (IG thinner, TT fatter). No box, no karaoke. Hooks skipped. Bodies and CTAs keep SpokenFix.

- [X] Tighter TT card, IG font only, smaller grabs, cover on each video
  TikTok plate uses a small corner (rounded-md), not a pill. Instagram stays Inter Tight with no plate. Drag targets hug the text and logos. Each finished video has Cover: play to a frame and save it.

- [X] TikTok card matches the native plate
  The card spans the frame (94%) so a sentence stays two full lines. Corner is 5px in Words and radius 14 in the file, with a tight pad. Already generated videos keep the old plate until the next Generate.

- [X] TikTok letters match the native line
  The bundled face is TikTok Sans Bold at optical size 14, the wider text cut the app uses. The 36pt display file was tighter. Already generated videos keep the old letters until the next Generate.

- [X] Words shows what burns
  Type, card, stroke, logos, +, =, and emoji in Words and on the tile are the same share of the frame as the file. Before, they were about 70% size, so logos that looked clear in Words landed on the words. The flame burns as a color emoji.

- [X] TikTok card sits on the words
  The white card was pinned to the bottom-right of the line, so the words sat outside it. The drawing now starts at 0,0 and libass centers it. The name at the top of Multiply is what videos start with. Already generated videos keep the old card until the next Generate.

- [X] Per-video words, music start, and delete
  Each finished video has Words + music (song or none, Music starts now) and Rebuild this video. Delete removes that file only and refreshes the list. Older videos need one new Generate before they can be tuned.
- [X] Emoji in the headline burn as emoji
  "BANGER 💥" burned a hollow box because the look fonts have no emoji glyphs. The emoji now holds its space in the line and the colour art is drawn there for the same window as the words; offline it is the outline glyph. Already generated videos keep the box until the next Generate or Rebuild.

- [ ] Split `assembleVideo` out of `lib/ffmpeg.ts`
  The file is past 300 lines again after the emoji overlay inputs. Probe/run helpers and `videoFilter` can stay; the assembly belongs in its own module. `parseLogoItems` in `lib/hook-logos-math.ts` also still has two `unknown[]` type errors.

- [X] Words never sit on the logo row; Words wraps like the file
  Two hooks had an Instagram spot stranded on the logos from before the follow fix, so the IG files put the words on the logos. A headline that lands on a logo now steps just clear of it in Words, on the tile, and in the file, and lines break at the same width in all three. Generate or Rebuild the batch to redo the finished videos.

- [X] Say which finished file is IG/FB and which is TT/YT
  Each batch row shows an IG · FB or TT · YT pill (from the recipe, so older batches get it without a Rebuild) and a Download link that names the file the same way. Audit pass: tsc clean, 186 tests pass, one pre-existing lint warning left.
- [ ] Dependency audit: postcss (via next) and deepmerge-ts (via prisma CLI) flagged high; both transitive build-time tools. Fix is a pnpm override when Next/Prisma ship the bump, or pin now if the deal side asks.

- [X] Deals fit a flat month + view bonuses (Polsia)
  Deal form: flat pay for the month (spreads over the videos owed, live "each video is worth"), or pay per video; CPM stays; view bonuses list ($ at N views, once per video); posts owed and most allowed a day. They owe you adds crossed bonuses. Schema: monthlyPayCents, postsPerDayMax, bonusesJson on both databases.

- [X] ADHD pass over every creator page
  Only the next setup step shows; done ones fold away. Live's day forms default to the accounts already on the video instead of the first account in the list. Usernames print one @. Add a deal is grouped like Edit this deal. Shorter lines on Today, Cuts, Numbers, Multiply rows, Text hooks, Mix settings, and the cut tool.
- [ ] Live "Per day" default is 5 regardless of what the deals owe. Could default to the sum of active deals' posts a day, capped by their max.
- [X] OpenAI no-credits warning had no link
  Generate used to store the first 80 characters of the API error, so the billing URL died at `https://`. Out of credits now shows Add credits to the OpenAI billing page. Turn Spoken words off still generates without it.
- [X] Whisper 413 on a 25.2 MB clip
  Spoken captions now send a tiny voice mp3, not the video. The 25 MB OpenAI cap no longer blocks Generate. Tap Generate again on that batch.
- [X] Cover saved hid Words + music
  Cover used to replace the whole row. Both links stay visible; tap Words + music after you save a cover.
- [X] Rebuild every video from this body did nothing
  The body path required caption words already in the row map, and the second submit button often never sent scope. Each button has its own action now; the form says Rebuilding… while it burns.
- [X] Saved cover posts as the thumbnail on the apps
  Schedule now sends the cover frame to Outstand: Instagram gets the JPEG, YouTube gets it best-effort, TikTok gets the frame time. Facebook has no cover field.
- [X] Decide TikTok post mode
  TikTok now auto-publishes (`DIRECT_POST` + public) so the saved cover frame is the thumbnail. Inbox drafts are gone. If a post fails with `reached_active_user_cap`, wait and ship that one again the next day.
- [X] Reselect cover after a bad pick
  Cover stays after you save and after you set a time. Play to a new frame and tap Use this frame instead. Each save writes a new still so the old one is not stuck.
- [X] Live schedule shows which file is IG · FB vs TT · YT
  Each look is its own card: watch, cover, and which @ it posts to. Caption is labeled as the text under the video. Calendar chips name both looks.
- [X] Pick multiple accounts per mix, labeled IG / FB / TT / YT
  Each mix card lists only the matching apps. Check as many @s as you want. Deal no longer locks you to one set.
- [X] Calendar names the real apps, not the file looks
  Chips and the day dropdown now say IG · FB · YT — whatever accounts are checked on that video — instead of IG · FB + TT · YT on everything.
- [X] Live shows what each mix's videos are for, like Multiply
  Waiting list now shows every mix with IG · FB and TT · YT pills and the exact @s each file posts to, plus a Check accounts + cover link.
- [X] Dropped the leftover single-account dropdowns on Live
  Day slots and the batch scheduler always use the accounts checked on each video; missing checks get a loud warning instead of a silent skip.
- [X] Pick accounts right on Live
  Every waiting mix shows its IG · FB and TT · YT videos with account checkboxes; a tap saves instantly, then you schedule the mix on a day.
- [X] Deal on an account saves when you tap it
  Accounts page uses deal pills instead of a dropdown. Tap Polsia and it saves; the gold pill is the current deal.
- [X] Schedule shows that it is working
  The button says Scheduling… and a second click cannot send the same video twice. The day is claimed before the slow upload.
- [X] Cancel a scheduled video
  Scheduled list has Cancel. It drops the Outstand posts and puts the video back under finished, no day yet.
- [X] Account picks on Live are dropdowns
  Each mix's IG · FB and TT · YT lists stay closed and show who is checked. Open one to change the checks.
- [X] A mix picked on one day is greyed out on the others
  Day slots start on different videos. Choosing one disables it everywhere else so it cannot be scheduled twice.
- [X] Switching a day's mix stays open
  Days start on Pick a video. Only a mix already on the calendar is greyed out. Any other mix can be chosen.
- [X] Month view can schedule
  Each day on the month grid has the same Pick a video control as the week. Days outside the month are dimmed.
- [X] Month is an overview again
  Chips show what's already set. Tap a day to open that week and schedule there.
- [X] Mix upload no longer dies on a 403
  The file is sent on the exact link Outstand signed. Try again on the banner uploads mix 3.
- [X] Film day chips stay readable
  A month cell shows Mix N and the hook, not one letter and "No account". The grid scrolls sideways instead of crushing the days.
- [X] Scheduled replaces To schedule everywhere a video has a day
  The pill and the Schedule step use the same day. Mixes with no day still say To schedule.
- [X] Week day shows the video, and the time stays on that day
  The chip names the mix. A second video is another time on the same day, not the next day's date picker.
- [X] Library says Scheduled after a day is set
  Finished files keep the Ready pill until then. Once scheduledAt is set, the pill says Scheduled and the link says Open.
- [X] Try again shows that it is working
  The button says Trying… while the file uploads. A quiet minute used to look like the click did nothing.
- [X] A failed upload is not listed as scheduled
  The day is cleared when Outstand refuses the file. Scheduled rows show the date and say Scheduled. The failure names IG, FB, TT, or YT and which video.
- [X] Numbers pull the real Outstand totals
  The pull was looking for a views field Outstand does not send. It now reads the totals, and a saved YouTube link adds a Studio upload.
- [X] CapCut link on the editor job
  Paste a CapCut Teams link with the editor note. Open in CapCut jumps there. The finished file still drops back here.
- [X] Add videos asks for a title per video
  How many opens that many name boxes. Each card keeps the name you typed. The film day is still shared, and the post time is set later on each video.
- [X] Finished videos skip the film calendar
  New videos open on Cuts to drop the file. The eight Sitescout videos from Oct 2 were taken off Film days and put there too.
- [X] A finished drop says which apps it is for
  Cuts asks IG · FB, TT · YT, or Both before the file lands. Schedule shows that file on its row only, and the other row gets its own drop.
- [X] Facebook connect asks for every Page again
  A Page left unchecked the first time stayed off the available list. Connect facebook now makes Meta show that list again.
- [X] Library folders per batch
  Finished videos from a Multiply batch sit under that batch name. Still to do is above Posted. Hand-dropped videos stay under the deal.
- [X] Pick the part of the song
  Words + music plays the track. Use this part marks the second, and Rebuild starts the song there. The video still cuts the song off at the end.
- [X] Thumbnail is visible on Cut and Schedule
  The frame picker was a tiny player labeled cover, under Watch, and only on Schedule. Cut and Schedule now show a Thumbnail heading and Save this frame as the thumbnail.
- [X] One name is one video
  Schedule no longer offers a second drop on the same name. Cuts has Delete. A TT title starts on the TT · YT drop. Library rows say IG · FB or TT · YT.
- [X] Clicks were waiting behind Today's reload
  Today was rebuilding the whole page every 8 seconds, so the next click sat in line. That reload is off. Posts still update on the few-minute sweep. Clerk is remembered for a minute.
- [X] Pages and Schedule stop waiting on a full re-encode
  Today and Live no longer wait on Outstand before they paint. Schedule uploads a file that is already clean. New Multiply builds use veryfast.
- [X] Native caption stroke, past days cannot post
  Spoken captions use the same thin stroke as unboxed Words. Live hides a day that already happened, and a past clock is refused so Outstand cannot publish it on the spot.
- [X] Song slider moves smoothly
  The slider was four stops, so it snapped. It now moves from barely there to the loudest level that still stays under the voice. The batch line says 15 stories, then two files each.
- [X] Song volume slider
  Music on the batch, and Words + music on a video, has a slider. The loudest step still sits under the voice. Generate and Rebuild use that step.
- [X] Multiply voice and the middle clip
  The song was louder than the phone voice, so the mix now keeps the voice full and the song quiet. Generate stops when the Bodies clip is the same recording as a CTA, which was playing the ending twice.
- [X] Account labels survive Sync
  Sync was writing Outstand's name over the label. Existing accounts keep the label. The wiped ig/tt/yt/fb labels were put back.





