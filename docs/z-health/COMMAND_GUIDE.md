# Z-Health Command Guide

A practical guide to the slash commands and the agent flows available in the **Z-Health Knowledge Base** workspace for writing in Dr. Eric Cobb's voice.

Source of the voice spec: `eric-cobb-voice-spec-source.md` (in this folder) — Dr. Cobb's own June 15 feedback, distilled into a reusable prompt pack.

---

## How it fits together

There are three layers. You do not need to manage them — they are already deployed.

1. **The workspace system prompt (always on).** Every message you send in the Z-Health workspace already carries Dr. Cobb's voice spec: research-dense, teach-don't-argue, invisible sell, banned-words list, "Keep moving, Dr. C." sign-off. You do not need to paste a primer first. The old generic-chat workflow ("run the primer command first") is no longer necessary here.

2. **Slash commands (`/zh-*`).** Format-specific commands. Open the **Tools** menu under the message box, choose the **Slash Commands** tab, and pick one. The command keyword drops into the input. Append your topic/parameters and send.

3. **Agent flows.** Three `@agent` flows (Newsletter Generator, Email Blast Writer, Landing Page Copy Generator) that run a structured generation. Use `@agent` then describe what you want. The flows now embed the same voice spec.

---

## The slash commands

| Command | Use it for | Fill in |
|---|---|---|
| `/zh-primer` | Re-anchor a session that has drifted into generic AI writing. Rarely needed in this workspace since the system prompt already carries the spec. | — |
| `/zh-research` | The "low back newsletter" style: research-dense, named studies, teaches toward an implicit conclusion. | `{{TOPIC}}`, `{{PROMO_DETAILS}}`, `{{COURSE_URL}}` |
| `/zh-broke-model` | A newsletter built around one case that broke your clinical model. | `{{SHORT_CASE_DESCRIPTION}}`, `{{CONCEPT}}`, `{{COURSE_URL}}` |
| `/zh-was-wrong` | "I used to think X, now I think Y" — philosophical, identity-oriented, high trust. | `{{OLD_BELIEF}}`, `{{NEW_UNDERSTANDING}}`, `{{COURSE_URL}}` |
| `/zh-question` | A newsletter centered on a single question practitioners never think to ask. | `{{QUESTION}}`, `{{RELEVANT_COURSES_OR_STACK}}`, `{{PROMO_DETAILS}}`, `{{COURSE_URL}}` |
| `/zh-90days` | An honest "first 90 days" learning-curve letter for hesitant practitioners. | `{{PROMO_DETAILS}}`, `{{DATE}}` |
| `/zh-waiting-costs` | The Drucker-style "cost of inaction" capstone — use at the end of a newsletter arc. | `{{PROMO_DETAILS}}`, `{{DATE}}` |
| `/zh-style-check` | Critique a draft against the voice spec. Flags generic writing, banned words, em dashes, sell architecture. Does not rewrite. | `{{DRAFT}}` |
| `/zh-iterate` | Diagnose a draft against the reference newsletters, then produce a clean rewrite. | `{{DRAFT}}` |

### Filling in placeholders

After the command keyword drops into the input, type your specifics in the same message. The model treats the `{{...}}` tokens as the slots — just tell it the values. Example:

```
/zh-research  Topic: why vestibular dysfunction keeps showing up as low back pain.
Promo: all courses 50% off through June 30. Course URL: https://zhealth.com/courses
```

If there is no promo, say so — the model will write "P.S. If you want to go deeper, you can start here: <url>" and drop discount language.

---

## The recommended workflow

This mirrors how Dr. Cobb works when a draft lands in one iteration instead of eight.

1. **Pick a format command** (`/zh-research`, `/zh-broke-model`, etc.) and give it your topic and parameters. The system prompt already has the voice spec, so you do not need `/zh-primer` first.

2. **Read the draft.** If it feels research-dense, specific, and the sell is invisible — you may be done.

3. **If it feels generic,** run `/zh-style-check` and paste the draft (or just say "check the draft you just wrote"). It returns a point-by-point critique: unsupported assertions, banned words, em dashes, sell architecture problems.

4. **Run `/zh-iterate`** to get a clean rewrite that fixes everything the style check found.

5. **Manually edit** for the one or two truly sharp lines, and remove any lingering phrasing you personally dislike.

The single biggest lever is **specificity**. A draft that names "Hodges & Richardson showed anticipatory transversus abdominis activation is delayed 30-50ms in chronic low back pain" lands in one iteration. A draft that says "the inputs you were never trained to assess" takes eight. When in doubt, ask the model to make every assertion concrete and cite a named study.

---

## What the voice spec enforces

Baked into the system prompt and every command:

- **Research-dense:** named studies, authors, numbers — never "research shows."
- **Teach, don't argue:** walk through mechanisms until the conclusion is self-evident. Never tell a practitioner their "lens is too narrow."
- **Invisible sell:** the body is 100% education and story; the offer appears once, in a short P.S.
- **Banned words:** "outcomes" (use "results"), "uncomfortable"/"uncomfortably"/"sit with" (pop-psych sense), overused "quietly"/"slow erosion."
- **Banned patterns:** triple parallel structures used as rhythm, vague pseudo-smart lines, choppy fragment punchlines.
- **Minimal em dashes.** Sign-off: "Keep moving, Dr. C."

---

## The Z-Health corpus (the "hive mind") — wired in

Dr. Cobb's June 15 feedback identified the real bottleneck: the model writes with authority when it has Z-Health-specific source material, and pads with motivational framing when it does not.

That corpus is now live. The Z-Health knowledge base — **41,041 vectors** of zhealtheducation.com blog posts, podcast episode transcripts, and video transcripts (with speaker/timestamp metadata) — is loaded into the `zhealth_research` Qdrant collection that the workspace's native RAG queries on **every message**.

This means you do not need to "ask for" the source material or invoke an agent. Every chat and every `/zh-*` command in the Z-Health workspace automatically retrieves the most relevant transcript chunks and feeds them to the model as context. The substance now comes from Dr. Cobb's actual teaching language, not general knowledge.

**How it works:** AnythingLLM embeds your query with the native `nomic-embed-text-v1` model and runs a similarity search against the corpus (top 6 snippets, similarity threshold 0.2). The retrieved chunks appear under "Sources" beneath each response.

**Embedding note:** the corpus was originally embedded with `nomic-embed-text`; the workspace queries with `nomic-embed-text-v1` — the same model family, same 768-dim vector space, so retrieval is accurate. Verified with live queries (e.g. asking about "three-dimensional core training" returns the exact Episode 301 transcript chunk).

**A note on the MCP server:** the workspace also has a `qdrant-memory` MCP server. That is a separate tool — an agent scratchpad for storing/recalling notes during `@agent` sessions. It is *not* the corpus-query path and does not need to be; native RAG above handles the corpus.
