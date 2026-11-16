'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SOBOOF STUDIO — the keys Upload pushes with.

   A GitHub access token (and the name and e-mail commits are made under),
   typed in once on the studio's Keys tab. They are kept on this computer, in
   the user's own folder (~/.soboof-studio/keys.json), never in the site's
   repository: the studio publishes with `git add -A`, and a key in the repo
   would go up with the next upload.

   The token is never sent back to the page (the Keys tab only learns whether
   one is set and how it ends) and never put on a command line, where any
   program on the machine could read it: git gets it through its environment,
   as an extra HTTP header for github.com (GIT_CONFIG_COUNT, git 2.31 and
   later). With no token set, git pushes with whatever this machine already
   has (a credential manager, an SSH key), as the studio always did.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = process.env.SOBOOF_STUDIO_HOME || path.join(os.homedir(), '.soboof-studio');
const FILE = path.join(DIR, 'keys.json');

function readKeys() {
  try {
    const k = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return { token: String(k.token || ''), name: String(k.name || ''), email: String(k.email || '') };
  } catch {
    return { token: '', name: '', email: '' };
  }
}

/** Keep new keys. A token left out (undefined) stays as it was; '' takes it away. */
function saveKeys(patch) {
  const k = readKeys();
  if (typeof patch.token === 'string') k.token = patch.token.trim();
  if (typeof patch.name === 'string') k.name = patch.name.trim().slice(0, 120);
  if (typeof patch.email === 'string') k.email = patch.email.trim().slice(0, 200);
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(k, null, 2), { encoding: 'utf8', mode: 0o600 });
  try { fs.chmodSync(FILE, 0o600); } catch { /* Windows: the folder is the user's own */ }
  return keysView();
}

/** What the page may know: whether a token is set and its last four characters, never the token. */
function keysView() {
  const k = readKeys();
  return {
    tokenSet: !!k.token,
    tokenEnd: k.token ? k.token.slice(-4) : '',
    name: k.name,
    email: k.email,
    where: FILE,
  };
}

/** The environment git runs in: the token as a header for github.com, and no prompt that would hang. */
function gitEnv() {
  const k = readKeys();
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  if (k.token) {
    const basic = Buffer.from(`x-access-token:${k.token}`).toString('base64');
    env.GIT_CONFIG_COUNT = '1';
    env.GIT_CONFIG_KEY_0 = 'http.https://github.com/.extraheader';
    env.GIT_CONFIG_VALUE_0 = `AUTHORIZATION: basic ${basic}`;
  }
  return env;
}

/** The `-c` settings a commit is made with, when a name and e-mail are kept. */
function commitIdentity() {
  const k = readKeys();
  const args = [];
  if (k.name) args.push('-c', `user.name=${k.name}`);
  if (k.email) args.push('-c', `user.email=${k.email}`);
  return args;
}

/** A message from git, with the token taken out should it ever appear in one. */
function scrub(text) {
  const k = readKeys();
  let s = String(text || '');
  if (k.token) s = s.split(k.token).join('••••');
  return s.replace(/AUTHORIZATION: basic [A-Za-z0-9+/=]+/gi, 'AUTHORIZATION: basic ••••');
}

module.exports = { readKeys, saveKeys, keysView, gitEnv, commitIdentity, scrub, KEYS_FILE: FILE };
