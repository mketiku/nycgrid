Create a conventional commit for the current staged/unstaged changes.

## Instructions

1. Run `git status` and `git diff` (staged and unstaged) to understand all changes.
2. Run `git log --oneline -5` to match the repo's commit message style.
3. Draft a commit message following these rules:
   - Format: `type(scope): concise summary`
   - **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - **Scope**: optional but recommended — use short identifiers like `map`, `camera`, `photobooth`, `ui`, `hooks`, `lib`
   - **Subject length**: 7–14 words — enough context to be meaningful, not a paragraph
   - **Intent over mechanics**: describe what changed and why, not just "update X file"
   - **Never** add "Co-authored-by: Claude" or any AI attribution
   - For non-code changes (docs, ADRs, config only), append `[skip ci]` to avoid a Vercel build
4. Stage relevant files (prefer specific file names over `git add -A`).
5. Commit using a HEREDOC to preserve formatting.
6. Run `git status` to confirm success.

## Examples of good commit messages

- `feat(map): add coverage-gap overlay with borough boundaries`
- `fix(camera): handle missing feed URL gracefully in live view`
- `refactor(photobooth): extract strip layout into composable hook`
- `test(map): add coverage for turf intersection edge cases`
- `chore: update AGENTS.md with proxy.ts routing note [skip ci]`
