# pi-prompt-polish

Rewrite a draft prompt using recent conversation, then review it before sending.

`/polish` puts the rewrite back in Pi's editor without sending it. You can use it
alongside `/clarify`.

## Installation

Install the published package with:

```sh
pi install npm:@nimanzik/pi-prompt-polish
```

Each use makes an additional request to the current session model, which may
incur provider costs.

## Try it

From the repository root, start Pi with the extension loaded for one session:

```sh
pi -e ./extensions/pi-prompt-polish
```

In Pi's terminal UI, enter a draft after the command:

```text
/polish go with the second option but keep the old keyboard shortcut
```

If the recent conversation identifies the second option, the rewrite can name
it. If the reference is unclear, the model is asked to leave it alone. Press
Escape while the rewrite is running to cancel and recover the original draft.

## What gets sent

When you run `/polish`, it sends the draft and up to five recent user and
assistant messages from the active branch to the current session model. The
excerpt contains at most 8,000 characters of text. It does not include tool
calls, tool results, attachments, or messages from other sessions. Text pasted
into a message can still appear in the excerpt. Review what you have shared
before using the command in a session with sensitive material.
