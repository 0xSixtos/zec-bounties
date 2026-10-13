/**
 * A team wallet is a shared organisational treasury. Its seed must NEVER be
 * returned through the self-service personal-recovery flow (/auth/recovery/*),
 * which only verifies the caller's own account/email.
 *
 * Every team member is given a ZcashParams row that is owned by the member but
 * points at the shared team wallet directory (see syncWalletToMembers), so a
 * caller-owned row is NOT proof that the wallet is personal. Without this
 * check any plain team member could request their own OTP and read the team
 * wallet's seed phrase, then drain the treasury off-platform.
 *
 * @param {{ isTeam?: boolean, teamId?: string|null }} param
 * @returns {boolean}
 */
function isTeamWallet(param) {
  return Boolean(param && (param.isTeam || param.teamId));
}

module.exports = { isTeamWallet };
