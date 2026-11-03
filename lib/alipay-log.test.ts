import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { appendAlipayEvent, capAlipayLogField } from "./alipay";

const previousLog = process.env.AIPAY_EVENT_LOG_FILE;

async function withLogFile<T>(
  file: string,
  fn: () => Promise<T>
): Promise<T> {
  process.env.AIPAY_EVENT_LOG_FILE = file;
  try {
    return await fn();
  } finally {
    if (previousLog === undefined) delete process.env.AIPAY_EVENT_LOG_FILE;
    else process.env.AIPAY_EVENT_LOG_FILE = previousLog;
  }
}

test("capAlipayLogField limits logged request fields", () => {
  assert.equal(capAlipayLogField("short"), "short");
  assert.equal(capAlipayLogField("x".repeat(200)).length, 128);
  assert.equal(capAlipayLogField("abcdefghij", 4), "abcd");
});

test("appendAlipayEvent writes a json line", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "aipay-log-"));
  const file = path.join(dir, "events.jsonl");
  try {
    await withLogFile(file, () =>
      appendAlipayEvent("notify", { outTradeNo: "FQ1" })
    );
    const text = await readFile(file, "utf8");
    assert.match(text, /"kind":"notify"/);
    assert.match(text, /"outTradeNo":"FQ1"/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendAlipayEvent throws when the event cannot be stored", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "aipay-log-"));
  const blocker = path.join(dir, "not-a-directory");
  await writeFile(blocker, "x");
  try {
    await assert.rejects(() =>
      withLogFile(path.join(blocker, "events.jsonl"), () =>
        appendAlipayEvent("notify", { outTradeNo: "FQ1" })
      )
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
