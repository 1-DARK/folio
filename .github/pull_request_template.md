<!-- Title: a Conventional Commit, e.g. "fix(sidebar): keep the active tab after reload" -->

Closes #

## What changed


## How to test
1. 
2. 

## Screenshots
<!-- Before / after, for UI changes. Light and dark if it changes styles. -->

## Checklist
- [ ] This PR does one thing, and it's what the linked issue asks for
- [ ] Rebased on the latest `main` (`git fetch upstream` then `git rebase upstream/main`), not merged
- [ ] Typecheck passes: `npx tsc --noEmit -p tsconfig.app.json`
- [ ] Translations pass: `node scripts/check-i18n.mjs` (new text in both `en` and `fr`, existing keys reused)
- [ ] Build passes: `npm run build`
- [ ] No new lint errors in my files: `npx eslint <changed files>`
- [ ] Tried it in the browser, with no new errors in the console
- [ ] Every commit is signed off (`git commit -s`)
