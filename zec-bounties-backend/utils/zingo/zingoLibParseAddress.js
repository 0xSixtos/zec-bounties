const { execFileSync } = require("child_process");
const { existsSync } = require("fs");
const { isSafeShieldedAddress } = require("../../helpers/validateAddress.js");

async function executeZingoParseAddress(zaddress, params) {
  const command = "parse_address";
  if (!zaddress) throw new Error("No zaddress provided");

  // Sink-level guard: never let a value that isn't a plain base58/bech32
  // address reach the wallet CLI, regardless of what the caller validated.
  if (!isSafeShieldedAddress(zaddress)) {
    throw new Error("Invalid address");
  }

  const zingoPath = process.env.ZINGO_CLI;

  if (!existsSync(zingoPath)) {
    throw new Error(`zingo-cli not found at ${zingoPath}`);
  }

  // Pass each token as a separate argv element and run the binary directly
  // (execFileSync does NOT spawn a shell), so nothing in `zaddress` can be
  // interpreted as shell syntax.
  const args = [
    "--chain",
    params.chain || "testnet",
    "--server",
    params.serverUrl || "https://testnet.zec.rocks:443",
    "--data-dir",
    params.dataDir || "/error",
    command,
    zaddress,
  ];

  console.log(args.join(" "));

  try {
    // 1️⃣ Run CLI and capture full output
    const rawOutput = execFileSync(zingoPath, args, {
      stdio: "pipe",
    }).toString();

    // 2️⃣ Strip ANSI color codes
    const noAnsi = rawOutput.replace(/\u001b\[[0-9;]*m/g, "");

    // 3️⃣ Extract JSON blocks (any {…} including newlines)
    const jsonBlocks = noAnsi.match(/\{[\s\S]*?\}/g) || [];

    // 4️⃣ Parse each JSON block safely
    const parsed = jsonBlocks
      .map((block) => {
        try {
          return JSON.parse(block);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // 5️⃣ Return array if >1 objects, or object if just 1
    console.log("resultz", parsed);
    if (parsed.length === 1) return parsed[0];
    return parsed;
  } catch (error) {
    throw new Error(
      `Zingo CLI error: ${error.stderr?.toString() || error.message}`,
    );
  }
}

module.exports = executeZingoParseAddress;
