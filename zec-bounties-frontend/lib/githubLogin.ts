import { backendUrl } from "@/lib/configENV";

// The callback page accepts a token only together with the state this tab
// sent, so a link that carries someone else's token cannot sign a user in.
const STATE_KEY = "githubLoginState";

export function startGithubLogin() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(STATE_KEY, state);
  window.location.assign(`${backendUrl}/auth/github?state=${state}`);
}

export function readGithubLoginState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function clearGithubLoginState() {
  sessionStorage.removeItem(STATE_KEY);
}
