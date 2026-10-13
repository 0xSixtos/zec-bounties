const test = require("node:test");
const assert = require("node:assert/strict");

const { isTeamWallet } = require("../helpers/walletRecovery.js");

// The personal recovery flow (/auth/recovery/verify-otp) returns a wallet's
// seed phrase. It must refuse team wallets, because every team member holds a
// ZcashParams row (ownerId = member) that points at the shared team wallet.

test("isTeamWallet detects a team wallet by isTeam flag", () => {
  assert.equal(isTeamWallet({ isTeam: true, teamId: null }), true);
});

test("isTeamWallet detects a team wallet by teamId", () => {
  assert.equal(isTeamWallet({ isTeam: false, teamId: "team_123" }), true);
  assert.equal(isTeamWallet({ teamId: "team_123" }), true);
});

test("isTeamWallet treats a personal wallet as recoverable", () => {
  assert.equal(isTeamWallet({ isTeam: false, teamId: null }), false);
  assert.equal(isTeamWallet({}), false);
  assert.equal(isTeamWallet(null), false);
  assert.equal(isTeamWallet(undefined), false);
});

// Mirrors the guard in routes/auth.js verify-otp: a member's synced team-wallet
// row must be blocked before any seed is read.
test("a member's synced team-wallet row is blocked from recovery", () => {
  const memberSyncedRow = {
    ownerId: "attacker-member",
    accountName: "TeamPayouts",
    walletId: "shared-team-dir",
    isTeam: true,
    teamId: "team_123",
  };
  assert.equal(isTeamWallet(memberSyncedRow), true, "team row must be rejected");
});
