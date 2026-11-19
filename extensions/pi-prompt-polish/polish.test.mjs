import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

class Loader {
  controller = new AbortController();
  signal = this.controller.signal;
  cancel() {
    this.controller.abort();
    this.onAbort();
  }
}

const context = createContext({
  AbortController,
  AbortSignal,
  setTimeout: (...args) => setTimeout(...args),
  clearTimeout: (...args) => clearTimeout(...args),
});
const source = await readFile(new URL("./polish.ts", import.meta.url), "utf8");
const extension = new SourceTextModule(stripTypeScriptTypes(source), { context });
await extension.link(() => new SyntheticModule(["BorderedLoader"], function () {
  this.setExport("BorderedLoader", Loader);
}, { context }));
await extension.evaluate();

const block = (text) => ({ type: "text", text });
const message = (role, content) => ({ type: "message", message: { role, content } });
const successful = { stopReason: "stop", content: [block("Use the existing shortcut.")] };
const indentedDraft = "  pick the second option\n    keep the shortcut  \n";

function setup(branch = [], result = async () => successful) {
  const requests = [];
  const signals = [];
  const closes = [];
  const editor = [];
  const notices = [];
  const model = { id: "session-model" };
  let handler;
  let loader;
  extension.namespace.default({
    registerCommand(name, command) {
      assert.equal(name, "polish");
      handler = command.handler;
    },
  });
  const ctx = {
    mode: "tui",
    model,
    sessionManager: { getBranch: () => branch },
    modelRegistry: {
      streamSimple(chosen, input, options) {
        assert.equal(chosen, model);
        assert.equal(options.cacheRetention, "none");
        signals.push(options.signal);
        requests.push(JSON.parse(input.messages[0].content));
        return { result };
      },
    },
    ui: {
      custom: (create) => new Promise((resolve) => {
        loader = create(null, null, null, (value) => {
          closes.push(value);
          resolve(value);
        });
      }),
      setEditorText: (text) => editor.push(text),
      notify: (text) => notices.push(text),
    },
  };
  return { run: (args) => handler(args, ctx), requests, signals, closes, editor, notices, cancel: () => loader.cancel() };
}

test("sends only recent visible conversation and puts the rewrite in the editor", async () => {
  const app = setup([
    { type: "compaction", summary: "old summary" },
    message("user", [block("Compare two shortcuts."), { type: "image", data: "not sent" }]),
    message("assistant", [{ type: "thinking", thinking: "not sent" }, block("Option 2 is the existing shortcut."), { type: "toolCall" }]),
    message("toolResult", [block("not sent")]),
    message("assistant", [{ type: "toolCall" }]),
  ]);
  await app.run(indentedDraft);
  assert.deepEqual(app.requests, [{
    history: [
      { role: "user", text: "Compare two shortcuts." },
      { role: "assistant", text: "Option 2 is the existing shortcut." },
    ],
    draft: indentedDraft,
  }]);
  assert.deepEqual(app.editor, ["Use the existing shortcut."]);
});

test("omits CLI attachment paths and contents while keeping the user's instruction", async () => {
  const app = setup([message("user", [block(
    '<file name="/tmp/polish-fixture.txt">\nATTACHMENT_SENTINEL\n</file>\nSTILL_ATTACHMENT_TEXT\n</file>\n' +
    '<file name="/tmp/image.png"></file>\nKeep this instruction',
  )])]);
  await app.run("make it clearer");
  assert.deepEqual(app.requests[0].history, [{ role: "user", text: "Keep this instruction" }]);
});

test("keeps ordinary file-tag examples in conversation history", async () => {
  const text = 'Preserve <file name="x">example</file> in the documentation.';
  const app = setup([message("user", text)]);
  await app.run("do that");
  assert.deepEqual(app.requests[0].history, [{ role: "user", text }]);
});

test("escapes terminal controls without losing multiline formatting", async () => {
  const app = setup([], async () => ({
    stopReason: "stop",
    content: [block("  first\r\n\tsecond\n\n    third\x1b\x07\r\x7f\x9b\n")],
  }));
  await app.run("rewrite this");
  assert.deepEqual(app.editor, ["  first\n\tsecond\n\n    third\\x1b\\x07\\x0d\\x7f\\x9b\n"]);
});

test("keeps at most the last five messages in chronological order", async () => {
  const app = setup(Array.from({ length: 8 }, (_, i) => message("user", `Message ${i}`)));
  await app.run("rewrite this");
  assert.deepEqual(app.requests[0].history.map(({ text }) => text),
    Array.from({ length: 5 }, (_, i) => `Message ${i + 3}`));
});

test("bounds history text without trimming the draft", async () => {
  const newest = "z".repeat(7_999);
  const app = setup([message("user", "skip me"), message("user", "older"), message("user", newest)]);
  const draft = "d".repeat(8_001);
  await app.run(draft);
  assert.deepEqual(app.requests[0].history, [{ role: "user", text: "…" }, { role: "user", text: newest }]);
  assert.equal(app.requests[0].draft, draft);
});

test("does not make a model request for an empty draft", async () => {
  const app = setup();
  await app.run("  ");
  assert.deepEqual(app.requests, []);
  assert.deepEqual(app.editor, []);
  assert.deepEqual(app.notices, ["Usage: /polish <draft>"]);
});

test("restores the original draft and reports the provider's error result", async () => {
  const app = setup([], async () => ({
    stopReason: "error",
    errorMessage: "Authentication failed\x07",
    content: [block("partial text")],
  }));
  await app.run(indentedDraft);
  assert.deepEqual(app.editor, [indentedDraft]);
  assert.match(app.notices[0], /Polish failed.*Authentication failed\\x07/);
});

test("restores the original draft and reports a rejected request", async () => {
  const app = setup([], async () => { throw new Error("Connection reset"); });
  await app.run(indentedDraft);
  assert.deepEqual(app.editor, [indentedDraft]);
  assert.match(app.notices[0], /Polish failed.*Connection reset/);
});

test("cancellation restores the original draft and ignores a late response", async () => {
  const completion = Promise.withResolvers();
  const app = setup([], () => completion.promise);
  const task = app.run(indentedDraft);
  await Promise.resolve();
  assert.equal(app.requests.length, 1);
  app.cancel();
  await task;
  assert.equal(app.signals[0].aborted, true);
  completion.resolve(successful);
  await new Promise(setImmediate);
  assert.equal(app.closes.length, 1);
  assert.deepEqual(app.editor, [indentedDraft]);
  assert.deepEqual(app.notices, []);
});

test("deadline restores the draft even if the provider ignores abort", { timeout: 1000 }, async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const completion = Promise.withResolvers();
  const app = setup([], () => completion.promise);
  const task = app.run(indentedDraft);
  await Promise.resolve();
  assert.equal(app.signals[0].aborted, false);
  t.mock.timers.tick(60_000);
  await task;
  assert.equal(app.signals[0].aborted, true);
  assert.deepEqual(app.editor, [indentedDraft]);
  assert.match(app.notices[0], /Polish failed.*within 60 seconds/);

  completion.resolve(successful);
  await new Promise(setImmediate);
  assert.equal(app.closes.length, 1);
  assert.deepEqual(app.editor, [indentedDraft]);
  assert.equal(app.notices.length, 1);
});
