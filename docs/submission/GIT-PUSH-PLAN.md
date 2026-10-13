# Reviewed commit and safe two-branch push plan

Repository: `https://github.com/shaythegay13/monad-metropolis.git`.
Current local branch: `monad-metropolis`, tracking `origin/signal-passport-monad`.
Git inspection fetched origin and read both real remote tips:

```text
refs/heads/monad-metropolis     584a2abf11b673f16e26ad321b0d9ae42000640a
refs/heads/signal-passport-monad 584a2abf11b673f16e26ad321b0d9ae42000640a
```

The local child commit containing this plan records the accepted M8 documentation closeout,
accepted M9A source/tests/configuration/native evidence, owner-authorized MIT/README
disclosures and the requested submission preparation materials. The exact commit
hash is returned to the owner after creation; it is **not** the deployed source hash.
The production Vercel build remains pinned to `584a2ab...`.

## Approval boundary

**No push is performed in this preparation.** The owner must approve the final
reported commit hash and both named remote updates. No force, force-with-lease,
history rewrite, branch deletion or release/deployment command is authorized.

Vercel was inspected read-only: Git `link` remains `null`, production target is
`dpl_FqH7PT5vNASPuaBsmi2y3prq5ERY`. There is no tracked GitHub Actions workflow
in this repository. Do not reconnect Git deployment or introduce a deploy hook.
Before an approved push, recheck these conditions; stop if they changed.

## Execute only after owner approval

1. Require a clean worktree and confirm `HEAD` equals the exact hash the owner approved.
2. `git fetch origin`, then `git ls-remote --heads origin monad-metropolis signal-passport-monad`.
3. Both remote tips must still equal the snapshot above. If either changed,
   stop for review; never reset or force it. Confirm both tips are ancestors
   of the approved commit with `git merge-base --is-ancestor`.
4. Use the explicit approved SHA, not an unreviewed newer HEAD, in one atomic,
   normal fast-forward push:

```text
git push --atomic origin <OWNER_APPROVED_COMMIT>:refs/heads/monad-metropolis <OWNER_APPROVED_COMMIT>:refs/heads/signal-passport-monad
```

The completion response provides this command with the real hash substituted.
Normal Git fast-forward checks remain effective. Atomic mode updates both refs
or neither; if the server cannot support it, stop rather than silently switching
to separate partial pushes. No `+` refspec or force flag may be added.

5. Verify both actual remote tips equal the approved commit, the worktree remains
   clean, and the canonical Vercel URL still serves the same accepted deployment.
   This is source publication only; do not redeploy the application or CRE.

The repository's default `monad-metropolis` branch and production-source
`signal-passport-monad` branch will expose the same reviewed source after this
approved push. No local branch reset/checkout is needed to update both remote refs.
