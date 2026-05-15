<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I want to summarize this. conversation history into a set of instructions for how to write a newsletter according to how Dr. Eric Cobb prefers it. I would like to have multiple commands I can use with anything llm that pre-prompt for specific kinds of work. Take all of this into account and provide all of this to me with detailed instructions on how to use them to produce the best results.

You have one new message.

[Skip to content](https://mail.google.com/mail/u/0/)
[Using Gmail with screen readers](https://mail.google.com/mail/u/0/)
23 of 146
June 15 Morning Feedback
Inbox
Dr. Eric Cobb [drcobb@zhealth.net](mailto:drcobb@zhealth.net)
3:59 AM (6 hours ago)
to Nick, me
Hola:
Was able to get into the interface this morning and start working. No issues with memory or a lack of processing today so that was awesome. Here’s the interesting challenge for me today.
The Low Back Pain newsletter I did yesterday was stellar and took 15 minutes start to finish. 2 iterations with simple prompts and it was done. Staff loves it and it sounded like how I write.
Today, I started working on other newsletters for June and some sales emails and everything quickly converted to very generic AI-writing with a few scraps of Z-Health thrown in. I spent 4 hours in there today and it was a pretty identical experience to working on copy in Chat or Claude.
So, after getting pretty tired after the 13 iteration I did what I should have done in the first place and asked what was going on and here’s the response:
Why the low back newsletter worked from iteration one:
It’s research-dense. Specific studies, specific authors, specific numbers. Brinjikji et al., Hodges and Richardson, Flor et al. The reader learns something concrete on every scroll. My June newsletters were making assertions without evidence. “The recurrence rate is 60-80%” repeated across four newsletters is not the same as walking someone through the Brinjikji systematic review of 3,000 asymptomatic people and letting the data do the arguing.
It has personality and humor. “I made that stat up, but you believed it for a second, didn’t you?” and “Your low back called. It has questions.” The June newsletters I wrote are earnest but essentially humorless. Eric has range. Beating the Freeze is philosophical. The low back newsletter is provocative and a little irreverent. I was treating Beating the Freeze as the only template when it’s actually just one register Eric writes in.
It teaches, it doesn’t argue. The low back newsletter never once says “you should expand your assessment.” It walks you through APAs, cortical reorganization, pain phenotypes, cognitive-motor integration, and visual/vestibular inputs with enough depth that the conclusion is self-evident. My June newsletters kept telling practitioners their lens was too narrow instead of showing them what they were missing with enough specificity to make the point undeniable.
The sell is invisible. One mention, in the P.S., after 1,400 words of genuinely useful content. My June newsletters had the sale woven through the body, the closing, the CTA buttons. Even when we pulled back, the architecture was still “argument leading to purchase decision.” This newsletter’s architecture is “here’s something fascinating and clinically useful, oh and by the way.”
On the hive mind question — yes, that’s the other half of it.
The low back newsletter works because whoever wrote it had access to specific Z-Health curriculum concepts (APAs, cortical remapping, pain phenotyping, cognitive-motor integration protocols), specific research citations, and Eric’s actual clinical framework in enough detail to write with authority. I was working from general knowledge of pain neuroscience and the fragments I could find in workspace transcripts. That’s why my versions kept defaulting to vague framing (“the inputs you were never trained to assess”) instead of specific, teachable content (“Hodges and Richardson showed that anticipatory activation of transversus abdominis is delayed 30-50ms in chronic low back pain patients”).
The difference between vague and specific is the difference between one iteration and eight.
What would fix this going forward:
If the Z-Health transcripts from /Volumes/Public/ZHealth (the 673 source files from Phase H) were wired into the hive mind, I’d have access to Eric’s actual teaching language, his specific clinical examples, the research he cites, and how he explains each concept. That’s 17.5 hours of clinical content that would let me write with the same density and authority as the low back newsletter instead of padding with motivational framing because I don’t have enough substance to fill the page.
The June newsletters aren’t bad writing. They’re thin writing dressed up as deep writing, and that’s a direct result of not having enough Z-Health-specific material to draw from. Give me the data and I can write like the low back newsletter. Without it, I default to persuasion, which is exactly what Eric’s audience doesn’t want.
This is pretty much what I thought and I know you are aware, but thought I would send this on to you if it’s of any help. I’m going to get out of the interface for now and come back to it this weekend. If there are specific things I can do in terms of prompting or asking what it has access to before I try more writing projects, marketing, landing page copy, etc please let me know. 
Loving this process for far. Super interesting and exciting.

Because you attached a long prior conversation, I’m treating that as the ground truth of Eric’s preferences and turning it into a reusable “spec + prompt pack” you can drop into any LLM. Everything below is distilled from that thread, not generic copywriting advice.[^1_1]

***

## Core principles Eric cares about

These are the non‑negotiables that made the low back pain newsletter “just work” and made the June drafts feel wrong to him.[^1_1]

- **Research-dense, specific, teachable.**
Use concrete studies, authors, numbers, and named concepts (Brinjikji et al., Hodges \& Richardson, Flor; APAs, cortical remapping, pain phenotypes, cognitive-motor integration, visual/vestibular inputs). The reader should learn something concrete every scroll, not just hear assertions like “recurrence is 60–80%.”[^1_1]
- **Teach, don’t argue or persuade.**
The newsletter walks through mechanisms and evidence until the conclusion is self-evident; it doesn’t tell practitioners “you should expand your assessment” or “your lens is too narrow.”[^1_1]
- **Sell is invisible and quarantined.**
The body is 100% education and story; the sale appears once, in the P.S. (plus at most a mid-body button), after ~1,400 words of real content. Architecture is “here’s something fascinating and clinically useful, oh and by the way…,” not “argument leading to purchase decision.”[^1_1]
- **Voice has range.**
He’s comfortable being philosophical (Beating the Freeze) or provocative/irreverent (low-back “100 Billion Back Problem”). Don’t lock into one “motivational” register.[^1_1]
- **Show his lens, not generic “pain neuroscience.”**
Great drafts use Z-Health concepts and language (APAs, cortical remapping, vestibular deficits driving lumbar tension, etc.) instead of vague phrases like “inputs you were never trained to assess.”[^1_1]
- **Case-first and self-critical.**
He likes stories where he’s the one who was wrong or limited (walking Advil, missing a visual/vestibular issue, realizing assessment was the problem, not execution). This builds trust better than lecturing practitioners.[^1_1]

***

## Structural guidelines for newsletters

Use this as the default shape unless you intentionally choose a different pattern.[^1_1]

### Opening

- Start with a **mic-drop hook**:
    - A vivid, specific anecdote (“I was a walking Advil in year one of practice…”), or
    - A sharp quote he genuinely likes (Drucker, Gawande, Seneca, Kahneman) immediately tied to clinical reality.[^1_1]
- Get concrete within 3–4 sentences: who the patient was, what the pattern was, what was puzzling. Avoid vague “we’ve all been there” intros.[^1_1]


### Body

- Build around **one strong idea** carried through 3–5 sections:
    - “The lens problem”
    - “How I discovered what I wasn’t seeing”
    - “The first 90 days”
    - “What waiting actually costs,” etc.[^1_1]
- Embed **at least one detailed case** or composite story with real details (profession, timeline, failed interventions, what finally worked). This is where you integrate neuro concepts and research.[^1_1]
- Use **real research**: name the study and what it showed, not just “research shows.”[^1_1]


### Ending + CTA

- End the body on a **clinical or identity implication**, not a hard pitch (e.g., “The most valuable skill isn’t a better technique; it’s a wider assessment.”).[^1_1]
- Put **sales language in the P.S.**:
    - One or two short paragraphs.
    - Mention “50% off,” “everything in the curriculum,” or specific stacks if needed.
    - One link/button to courses or a sale page.[^1_1]
- If you need a mid-body CTA, it should feel like a **natural next step** from the teaching, not a tonal gear change.[^1_1]

***

## Language and tone rules Eric has explicitly flagged

These are the “AI tells” and stylistic constraints you want baked into every prompt.[^1_1]

- **Sentence structure**
    - Prefer **complete, flowing sentences** over choppy fragment punchlines.
Examples he disliked: “Repeat.” “The results were real. The relief was real. But the pattern was also real…” when used as a tic.[^1_1]
    - Develop an idea over 4–5 sentences before moving on; let paragraphs actually think out loud.[^1_1]
- **Avoid specific “AI-ish” words and patterns**
    - Words he called out:
        - “outcomes” (switch to “results”).[^1_1]
        - “uncomfortable,” “uncomfortably,” “sit with” in the pop-psych sense.[^1_1]
        - Overuse of “quietly,” “slow erosion,” etc., as vague emotional color.[^1_1]
    - Patterns he dislikes:
        - Triple parallel structures used as rhythm gimmick: “They’re the ones who…, they’re the ones who…, they’re the ones who…,” especially when repeated often.[^1_1]
        - Vague pseudo-smart lines like “seeing a complete picture that isn’t.”[^1_1]
- **Punctuation**
    - **Minimize em dashes**. He requested systematically replacing them with periods or simple conjunctions where possible.[^1_1]
- **Tone**
    - Avoid preachy, motivational-poster lines (“You’re not failing those clients because you lack skill…” as a sermon). He prefers **personal observation → inference → let reader conclude.**[^1_1]
    - Use precise, grounded phrases: “a question I couldn’t dodge,” “the kind of doubt you stop mentioning to colleagues,” rather than generic “slow erosion of confidence.”[^1_1]
- **Sign-off and framing**
    - Sign-off is “Keep moving, Dr. C.”[^1_1]
    - He is explicit that newsletters should **educate and entertain** so it becomes self-evident the reader needs more training, not sell directly.[^1_1]

***

## Recommended workflow with any LLM

Before the specific commands, here’s the usage pattern I’d recommend for best results.[^1_1]

1. **Paste the “Global Style Primer” command first** to get the model into Eric’s voice and constraints.
2. Then run a **format-specific command** (case study / “I was wrong” / “question nobody asks”) with the topic you want.
3. **Iterate like Eric does**:
    - Ask the model what feels generic or vague in its own draft.
    - Ask it to compare the draft to Beating the Freeze or the low back newsletter and identify mismatches in sentence structure, specificity, humor, and sales architecture.
    - Have it produce a “clean rewrite” after each critique round.[^1_1]
4. Finally, manually edit for:
    - One or two truly sharp lines (he often has one sentence that carries a lot of weight).
    - Removing any lingering AI-ish phrasing you personally dislike.[^1_1]

***

## Command 1: Global style primer (run this first)

Use this at the start of any session before you ask for a newsletter. It tells the model what “Eric voice” and newsletter architecture mean in practice.[^1_1]

```text
You are writing as Dr. Eric Cobb of Z-Health, to an audience of intelligent, clinically experienced practitioners.

Before you write anything, internalize these constraints and repeat them back in your own words:

1. PURPOSE
- Primary job: teach something clinically useful and interesting.
- Secondary job: entertain with personality, self-deprecation, and sharp lines.
- The sale must be invisible in the body and quarantined to a P.S.

2. CONTENT PRINCIPLES
- Be research-dense and specific: cite concrete studies, authors, and numbers, and tie them to real clinical decisions.
- Use Z-Health concepts and language when relevant: APAs, cortical remapping, pain phenotypes, cognitive-motor integration, visual/vestibular inputs, etc.
- Show, don’t argue: walk through mechanisms and cases until the conclusion is self-evident; avoid telling practitioners what they “should” do.

3. STRUCTURE
- Strong hook in the first 3–4 sentences: a vivid clinical anecdote or a mic-drop quote, immediately tied to practice.
- Middle: 3–5 sections developing one idea through specific cases, mechanisms, and research.
- End: land on a clinical or identity implication. Put any sales language only in a short P.S. at the end.

4. LANGUAGE RULES
- Prefer complete, flowing sentences over fragment punchlines.
- Avoid the words “outcomes,” “uncomfortable,” “uncomfortably,” and “sit with” in the therapy-pop-psych sense; choose more concrete phrases instead.
- Avoid AI-ish rhythms: don’t overuse triple parallel lists like “They’re the ones who… They’re the ones who…”.
- Minimize em dashes; use periods or simple conjunctions instead.
- Avoid vague clever lines like “seeing a complete picture that isn’t.” Be concrete and testable.
- Tone: observational, self-critical, precise. No motivational-poster language.

5. EMAIL FRAME
- Single-column letter style, no hero image.
- Voice is first-person singular (“I”), with honest admissions of where I was wrong or limited.
- Sign-off is “Keep moving, Dr. C.”

Acknowledge you understand this by restating the key constraints in your own words. Then wait for me to give you a specific newsletter brief.
```

**How to use it:**
Paste this, let the model summarize back the constraints, and correct anything it misses (especially the “sell in P.S. only” rule and banned words). Then give it one of the more specific commands below.[^1_1]

***

## Command 2: Research-dense concept newsletter

Use when you want a “low back newsletter” style piece: heavy clinical content, specific studies, teaches toward an implicit conclusion.[^1_1]

```text
Using the Eric Cobb style and constraints you just internalized, write a research-dense educational newsletter.

Parameters:
- Topic: {{TOPIC}}  (e.g., “why vestibular dysfunction keeps showing up as low back pain”)
- Audience: experienced clinicians and coaches, already familiar with basic pain science.
- Goal: make it self-evident that expanding neurological assessment is necessary, without explicitly arguing for it.

Requirements:
1. OPENING
- Hook with either:
  - A vivid, specific clinical case that puzzled me until I saw the neuro piece, or
  - A quote that genuinely fits the topic (Drucker, Gawande, Seneca, Kahneman), immediately tied to clinical practice.
- Become concrete by sentence 3–4: who the client was, what we tried, what kept failing.

2. BODY
- Teach through at least ONE detailed case and TWO named research findings.
- Explicitly name studies/authors and the relevant numbers (e.g., Brinjikji et al., Hodges & Richardson latency data, Flor’s work on cortical reorganization) where they actually apply.
- Introduce and explain any Z-Health concepts that matter (APAs, cortical remapping, vestibular driven spinal tension, etc.).
- Make the “lens problem” explicit: how a structurally-focused assessment missed the real driver.

3. TONE AND LANGUAGE
- First-person, self-critical where appropriate (e.g., where I was a “walking Advil” or treating the wrong input efficiently).
- No generic AI-ish phrasing (“outcomes,” “uncomfortable,” “sit with,” vague punchy fragments).
- Avoid triple parallel list tics and heavy em-dash usage.
- Let the teaching lead; never directly tell the reader what to buy or that they “must” change.

4. CLOSING
- End the main body on a clinical/identity insight, not a sales pitch.
- Then add ONE short P.S. that:
  - Mentions that all courses / the relevant course stack is currently {{PROMO_DETAILS}}, and
  - Points to a URL placeholder {{COURSE_URL}}.
- Sign off with “Keep moving, Dr. C.”

Produce the full newsletter in email-ready prose.
```

**How to use it:**
Fill in `{{TOPIC}}`, `{{PROMO_DETAILS}}`, and `{{COURSE_URL}}`. If there’s no promo, say “P.S. If you want to go deeper into this, you can start here: {{COURSE_URL}},” and drop explicit discount language.[^1_1]

***

## Command 3: Case that broke my model

Use for the “Cases That Broke My Model” format he and the prior agent discussed.[^1_1]

```text
Write an Eric Cobb newsletter in the “one case that broke my model” format.

Parameters:
- Case: {{SHORT_CASE_DESCRIPTION}} (e.g., “family physician with recurrent low back pain and mild sciatica, disc herniation diagnosis, nothing stuck until we looked at visual tracking and vestibular function”)
- Concept to teach: {{CONCEPT}} (e.g., “vestibular and visual drivers of lumbar tension”)

Constraints:
- Open with the concrete case immediately: who the person was, what they did for a living, how long the problem had been going on, what I tried first.
- Show how I exhausted the standard toolkit (list specific interventions) and still hit a ceiling.
- Introduce the neuro assessment pivot (visual/vestibular/anticipatory/etc.), including:
  - Exactly what test I ran.
  - What we found.
  - What we did about it.
- Tie this to 1–2 specific research findings and Z-Health concepts that explain WHY this worked.
- Explicitly name the uncomfortable question it raised for me (e.g., “How many other clients had this same driver that I never looked for?”) and how that changed my lens.
- Maintain all the style rules from the global primer: no AI-ish words, minimal fragments, no heavy em-dashes, no preaching.

End with:
- A short reflection on what this means for how the reader should THINK, not what they should buy.
- A P.S. that briefly mentions the relevant course(s) or curriculum area and links to {{COURSE_URL}}.
- Sign-off: “Keep moving, Dr. C.”
```

**How to use it:**
You provide the skeleton of the case; let the model fill in details consistent with Z-Health material, then adjust to match real patient stories if needed.[^1_1]

***

## Command 4: “I used to be wrong about…”

This matches the “Things I Was Wrong About” option he liked: high trust, self-critical, non-preachy.[^1_1]

```text
Write an Eric Cobb newsletter built around the theme “I used to think X, now I think Y.”

Parameters:
- Old belief: {{OLD_BELIEF}} (e.g., “pain is a tissue problem,” “strength is protective,” “experience automatically makes you better,” “assessment is the easy part”)
- New understanding: {{NEW_UNDERSTANDING}} (e.g., “pain is an output and strongly shaped by the nervous system,” etc.)

Requirements:
1. OPENING
- Start by stating the old belief in plain language and explaining why it made sense to me at the time.
- Use concrete examples from my early practice that show this belief in action.

2. TURNING POINT
- Describe a specific case, research finding, or experience that forced me to confront the limits of that belief.
- Make the moment as specific as possible: what day, what client, what study, what quote.

3. NEW LENS
- Walk through how my understanding changed and what I started seeing that I hadn’t seen before.
- Tie to Z-Health’s neuro framework and at least one named study or concept.

4. IMPLICATIONS
- Explain how this shift changed what I did in the clinic, and what it might change for the reader.
- No lecturing; keep it in the form “Here’s what I noticed and what I concluded. You can see where this goes.”

5. STYLE GUARDRAILS
- Respect all style rules from the global primer: no “outcomes,” “uncomfortable,” “sit with,” etc.; no fragment spam; minimal em-dashes; no generic motivational language.
- Keep the sell invisible: add a P.S. that notes how Z-Health curriculum reflects this newer understanding and links to {{COURSE_URL}} or “Browse all courses.”

Sign with “Keep moving, Dr. C.”
```

**How to use it:**
Good when you want a more philosophical / identity-oriented piece (similar to Beating the Freeze) that still subtly points at the need for more training.[^1_1]

***

## Command 5: “The question nobody asks…”

This is the “Questions Nobody Asks” pattern from the conversation—sharp and thought-provoking.[^1_1]

```text
Write an Eric Cobb newsletter centered on a single question most practitioners never think to ask.

Parameters:
- Core question: {{QUESTION}}  
  (e.g., “When did this actually start?” where “this” is the input problem, not the pain; “What is this person’s nervous system trying to protect?”; “What does this person’s brain think is happening?”)

Instructions:
- Open by stating the question plainly and explaining why it almost never gets asked in typical training.
- Show how most practitioners frame the problem instead (what they DO ask), and why that framing is insufficient.
- Use at least one detailed case to show how asking this question changes:
  - The history you take.
  - The assessments you run.
  - The interventions you choose.
- Tie this into at least one Z-Health concept and one specific research thread (e.g., cortical reorganization, anticipatory motor control, vestibular prevalence, pain phenotypes).
- Throughout, maintain Eric’s voice rules from the primer: complete sentences, observational tone, no AI-ish words, minimal em-dashes, invisible sell.
- End by inviting the reader to try asking this question with a specific client cohort (e.g., their “frequent flyers”) and noticing what changes.

P.S.: Briefly mention that if they want more concrete ways to act on this question, {{RELEVANT_COURSES_OR_STACK}} is currently {{PROMO_DETAILS}} at {{COURSE_URL}}.

Sign with “Keep moving, Dr. C.”
```

**How to use it:**
Pick a genuinely non-obvious question that he already uses in teaching; this format works very well when connected to a prior newsletter (e.g., as follow-up in a month-long arc).[^1_1]

***

## Command 6: “First 90 days” / learning curve letter

This models the June 15 “First 90 Days” concept he liked, but with the constraints that fixed the earlier drafts.[^1_1]

```text
Write an Eric Cobb newsletter that honestly describes what the first 90 days look like when a practitioner commits to neuro-based training.

Constraints:
- Audience: practitioners on the fence who are worried about the learning curve.
- Do NOT oversell. The goal is to be accurate, not reassuring.

Structure:
- Opening: describe the kind of email I get from practitioners who are “ready but hesitant,” and surface the real question (“How long until I feel competent again?”).
- Weeks 1–3: “productive confusion”
  - Detail how it feels to suddenly see more than you can act on.
  - Emphasize loss of the *feeling* of competence even though clinical skill hasn’t vanished.
- Weeks 4–6: the first meaningful win
  - A specific case where a new assessment finds something that explains a long-recurring problem.
  - How that changes the practitioner’s internal narrative.
- Weeks 7–12: integration
  - Intake and session flow change.
  - Confidence shifts from “knowing what to do” to “knowing what to look for.”
- Style: keep all global style constraints (no AI-ish words, minimal em-dashes, observational tone, self-critical where appropriate).
- Close: highlight that the learning curve is finite and that the bigger risk is staying in a comfortable but incomplete model.

P.S.: mention that all courses / tracks are {{PROMO_DETAILS}} through {{DATE}}, and invite replies from people who want help choosing a starting point.

Sign with “Keep moving, Dr. C.”
```

**How to use it:**
Great as the third email in a month where the first newsletter framed “the freeze” and the second introduced the lens problem; it addresses concrete objections without sounding like a brochure.[^1_1]

***

## Command 7: “What waiting actually costs”

This codifies the Drucker-style “cost of inaction” piece.[^1_1]

```text
Write an Eric Cobb newsletter on “what waiting actually costs.”

Constraints:
- Open with a quote that genuinely fits the topic (default: Peter Drucker’s “There is nothing so useless as doing efficiently that which should not be done at all.”).
- Immediately translate that quote into clinical reality: becoming very good at treating the wrong input because of a narrow assessment model.
- Make a sharp distinction between:
  - The visible, easy-to-calculate cost of changing (course price, hours, feeling like a beginner).
  - The invisible, rarely calculated cost of not changing (years of clients who got good care instead of complete care).
- Use at least one concrete numerical example:
  - Recurrence rates for low back pain.
  - Years a practitioner spends comfortable inside a narrow lens.
- Include the recurring regret line early: “The single biggest professional regret I hear from practitioners who eventually expand their assessment is, ‘I wish I’d done this sooner.’” Then later, call back to it without repeating the whole paragraph.
- Keep tone reflective, not scolding. No motivational platitudes.
- End by summarizing the month’s arc if this is the final June newsletter: freeze → lens problem → first 90 days → cost of waiting.

P.S.: Brief mention that everything is {{PROMO_DETAILS}} through {{DATE}}, explicitly framed as reducing the visible cost of changing, without hand-waving the learning curve.

Sign “Keep moving, Dr. C.”
```

**How to use it:**
Use as capstone of a 3–4‑newsletter arc when there is a significant promo running. It should feel like the logical consequence of the prior letters, not a sudden sales pitch.[^1_1]

***

## What I’m assuming and what’s missing

- I’m inferring some general rules (like “single-column layout, no hero image”) from the editor notes and using them as soft guidance, not hard constraints.[^1_1]
- I only see the portions of Eric’s writing present in this conversation (Beating the Freeze, low back, June drafts). I don’t have his full historical archive, so this spec is tuned to *this* era of his voice.[^1_1]
- I haven’t recreated his exact research citations (Brinjikji, Hodges \& Richardson, Flor, etc.), just the pattern and expectations; you should still pull exact details from your hive mind or source library when you actually draft.[^1_1]

If you want, next step I can do is take one of these commands, run it against a concrete topic you choose, and then show you how I’d iteratively push it closer to Eric’s final edits.

<div align="center">⁂</div>

[^1_1]: paste.txt

