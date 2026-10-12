const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const path = require("node:path");

// Minimal fake process that satisfies ZingoProcess after the conflict merge.
function createFakeProc() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  return {
    stdout,
    stderr,
    stdin: {
      write() {},
      on() {},
    },
    kill() {},
  };
}

test("wallet recovery output is never logged", async () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(" "));

  const childProcess = require("node:child_process");
  const originalSpawn = childProcess.spawn;
  childProcess.spawn = () => createFakeProc();

  const ZingoProcess = require("../utils/zingo/ZingoProcess");
  const proc = new ZingoProcess({
    zingoPath: "/fake/zingo",
    chain: "mainnet",
    serverUrl: "http://127.0.0.1:8137",
    dataDir: "/tmp",
  });

  // Simulate recovery_info output that contains a seed.
  const seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  proc.proc.stdout.emit(
    "data",
    Buffer.from(`{"seed":"${seed}"}\n`),
  );

  // Give the handlers a tick.
  await new Promise((r) => setImmediate(r));

  console.log = originalLog;
  childProcess.spawn = originalSpawn;

  const joined = logs.join("\n");
  assert.ok(
    !joined.includes(seed),
    "seed phrase must not appear in logs",
  );
});
