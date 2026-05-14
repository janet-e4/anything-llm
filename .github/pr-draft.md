# feat(PromptInput): restore user message after provider errors

## Problem

When the LLM backend returns an error response (e.g. the provider is unreachable),
the user's typed message is silently lost. This happens because:

1. `clearPromptInputDraft()` fires in `handleSubmit` **before** the API call
2. `setMessageEmit("")` clears the textarea immediately after
3. The stream error arrives asynchronously, but by then both the textarea and
   the localStorage draft are already wiped

The user sees "Could not respond to message" with an empty input box and must
re-type their entire message to retry.

## Solution

Added `savePromptInputDraft(storageKey, value)` to `usePromptInputStorage` —
a counterpart to the existing `clearPromptInputDraft`. Then in `ChatContainer`,
the `chatHandler` passed to `multiplexStream` now tracks whether the stream
ended with `type: "abort"`. If it did, after `multiplexStream` resolves:

- `setMessageEmit(promptMessage.userMessage)` restores the text to the textarea
- `savePromptInputDraft(storageKey, message)` writes it back to localStorage

This means on any provider error the user's message reappears in the input
ready to retry — no re-typing needed.

## Changes

- `frontend/src/hooks/usePromptInputStorage.js` — add exported
  `savePromptInputDraft(storageKey, value)` function (16 lines, mirrors
  existing `clearPromptInputDraft`)
- `frontend/src/components/WorkspaceChat/ChatContainer/index.jsx` — import
  `savePromptInputDraft`; wrap `chatHandler` in `fetchReply` to detect
  `type: "abort"`; restore message after stream on error (14 lines)

**No new dependencies. No changes to existing autosave/restore behavior
(page refresh drafts, debounced writes, thread/workspace scoping).**

## Test steps

1. Open any workspace in chat mode
2. Type a message
3. Temporarily break the LLM provider (e.g. set an invalid API key or base URL)
4. Submit the message
5. ✅ "Could not respond to message" error appears
6. ✅ The typed message reappears in the textarea
7. ✅ On page refresh, the draft is also restored
8. Restore the correct provider config
9. Resubmit — message sends successfully
10. ✅ Textarea clears, draft is gone, response appears

## Affected providers

This fix is provider-agnostic — it triggers on any `type: "abort"` stream
response regardless of which LLM backend is configured.
