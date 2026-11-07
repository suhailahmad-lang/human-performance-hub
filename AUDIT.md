# Human Performance MVP — development pass

## Changes

- Fixed strict TypeScript errors in domain lookup, planner indexing, validation messages, optional props, auth search parameters, set-array access, and analytics inference. No visual redesign.
- Reviewed all six user-owned tables. Retained owner-scoped RLS, explicitly restricted grants, and added composite owner foreign keys for planned workout → plan, session → planned workout, and set → session. These also prevent owner reassignment from breaking ownership relationships. Added parent ownership checks to write policies.
- Kept the 40-exercise catalogue SELECT-only for anonymous and signed-in users. Revoked public execution of the signup-only security-definer trigger function. Database linter now reports no findings. No service-role credential was introduced or exposed.
- Replaced multi-request plan replacement and workout completion with authenticated server functions calling security-invoker transactional database functions. A failed write rolls back the operation. Plan replacement is serialized per user and only activates the replacement after its workouts exist. Workout completion locks its parent, returns an existing session on retry, writes sets, and closes the planned workout together. Modified sessions count as completed work while retaining their modified session status; skipped sessions persist zero duration and no sets.
- Kept onboarding incomplete until plan creation succeeds. Plan generation reads the saved profile and catalogue under the authenticated user's permissions; it does not trust a caller-supplied owner.
- Corrected multi-item equipment requirements while preserving explicit alternatives for goblet squat, Romanian deadlift, overhead press, and inverted row. Exercise detail text now distinguishes alternatives from required combinations.
- Applied the sedentary three-day cap before the beginner/under-18 four-day caps. Explicit preferred domains no longer silently reintroduce unrelated goal domains. Unknown domains are filtered, missing experience defaults to beginner, and the seventh scheduled day remains recovery even without matching recovery catalogue items. Existing limitation filters and demanding-domain spacing remain in place.
- Validated set fields before saving: integer reps/seconds/set numbers, finite bounded load/distance, integer duration/RPE, and preserved original set numbering. Empty set rows are omitted.
- Corrected 7/30/90-day ranges to include exactly the named number of calendar dates, ending today. Excluded future entries in range queries, sorted weekly totals by ISO week date, counted only completed/modified sessions, and exposed wellbeing loading/error states.
- Improved check-in/auth error handling and busy-state cleanup; cleared private query caches on identity transitions. Mutations refresh the relevant queries after success.
- Completed unique leaf-page social metadata. Bundled athlete media is not tagged with an invalid relative social-image URL.
- Applied formatting-only changes required by the existing lint configuration. Auto-generated integration files and route tree are excluded from lint because they are managed and cannot be hand-formatted. Existing six design-system fast-refresh warnings remain.
- AI Coach remains clearly marked demo/no live AI. No provider, paid service, credentials, publication, or new project was added.

## Verification

| Check | Result |
| --- | --- |
| Baseline tests | 6 passed across 2 files |
| Baseline lint | 828 formatting errors, 6 existing warnings |
| `bunx vitest run` after changes | 31 passed across 4 files |
| `bun run lint` after changes | Exit 0; 0 errors, 6 existing fast-refresh warnings |
| Platform automatic TypeScript/build checks | Latest observed entry: `build OK` at 2026-11-07 02:12:41 UTC |
| Manual `bun run build` / typecheck | Not run: this environment requires the platform's automatic checks rather than manual build/typecheck execution |
| Database migration | Applied; all three composite ownership constraints verified present and validated |
| Database linter | No findings |
| Anonymous catalogue read | 40 exercises returned |
| Anonymous catalogue write / workout completion | Denied |
| Anonymous private-table reads | Denied for all six tables |
| Browser public/auth routes | Loaded without page errors; auth mode changes update URL; all tested protected pages redirect signed-out visitors |
| Desktop/mobile sign-in layout | Verified at 1280×1800 and 390×844; no mobile horizontal overflow |

## Remaining blockers and manual setup

- **Authenticated path: UNVERIFIED.** The database has zero auth users. Session minting failed because there is no account to sign in as. A reserved-domain audit signup was rejected and created no user. Create and sign in to the first real account through the preview; no new service credentials are required. Then exercise assessment → plan → workout with sets → completion → progress, check-in overwrite, skip/modified cases, retry/concurrent completion, plan replacement rollback, and account switching.
- **Two-user live isolation tests: UNVERIFIED.** Parent ownership constraints, grants, and policies were verified in the database, but an authenticated cross-user adversarial flow requires two real accounts. The added tests cover planner and pure validation/analytics logic, not database transactions or live RLS behavior.
- **Hosted auth settings: UNVERIFIED.** No auth settings were changed. Email confirmation delivery and Google sign-in were not completed; a project-info read does not prove provider/signup settings.
- **Production build command:** rely on the platform automatic build result in this environment; an independently invoked production build has not been claimed.
- Existing rules still provide general fitness guidance, not medical personalization. Secondary goals/location do not acquire new planner behavior in this pass. No guarantees of outcomes.

Nothing was published.