# Campaign balance trial — Android 0.2.8

Status: experimental Android build on its own branch. Neither main nor the R2 release branch is merged or modified by this trial.

## Product question
From OP 06 to OP 10 mine density grows from ~20.7% to ~27.8%; OP 07–10 commonly stall even under exact Minesweeper logic. We want a smoother campaign progression with minimal engineering effort, without runtime no-guess CSP or new mechanics.

## Tested variants (same seeded samples)
- Baseline: OP 06–10 mine counts 35 / 45 / 55 / 65 / 80, old first-click protection.
- Density only: 35 / 40 / 47 / 54 / 62, old first-click protection.
- Opening only: old mine counts, but protect a full, inward-shifted 3×3 area even at edges/corners.
- Combined: mine count reduction plus inward 3×3 safe opening.

**Source:** [QA experiment CI run 41397252039](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41397252039), with 100 seeded boards per operation/origin/variant for basic deduction and 60 per operation/origin/variant for bounded exact CSP. Exact solver never peeks at underlying mines; cases exceeding compute limits stay *inconclusive*.

### Bounded exact CSP: fully solved without any guessing (out of 60 boards)
| Mission | Baseline center | Combined center | Baseline corner | Combined corner |
| --- | ---: | ---: | ---: | ---: |
| OP 07 | 3 | 21 | 4 | 11 |
| OP 08 | 0 | 11 | 2 | 8 |
| OP 09 | 2 | 13 | 1 | 9 |
| OP 10 | 0 | 8 | 0 | 2 |

New density helped center, and the full 3×3 opening generally improved the *amount of the field* initially exposed from a corner. Proven forced guesses remain; this deliberately is NOT a no-guess mode. Samples are limited/seeded; not player telemetry or full population probabilities.

## Changes in trial APK 0.2.8
- OP 07 45 → 40 mines; OP 08 55 → 47; OP 09 65 → 54; OP 10 80 → 62. Rows, columns, story, PAR unchanged. OP 01–06 mine counts untouched.
- Campaign only: guarantee a full 3×3 mine-free window at first click, even at a corner/edge. Existing classic Free Run generation untouched.
- Campaign base score bands for OP 07–10 use the **original reward mine counts**, so historical single-player high-score values are not mechanically reduced by the rebalance. Completion records are untouched.
- Important: a saved/unfinished legacy v0.2.7 campaign board with old mine count still resumes with its **exact original mine layout, score parameters and timer**. A newly started operation uses new mine count; no restart or save deletion on install.
- QA tests verify mine counts, 3×3 windows, classic Free Run rule, and migration of unfinished legacy OP 07–10 boards.

## Manual Android test
1. Install new APK 0.2.8 **over 0.2.7**. Do NOT uninstall. Verify campaign progress and any active saved mission remain intact. A current unfinished old mission should still show its old mine count until restarted/finished.
2. Enter a **new** OP 07 or OP 08 after finishing/leaving any saved game: UI should show 40/47 mines. Try first tap in upper-left corner; the 3×3 opening contains no mines (an initially revealed region is *not* guaranteed to contain all nine squares in one cascade).
3. Play a mission and assess whether fewer rounds feel unfairly forced, whether difficulty remains challenging. Check that Free Run is still classic and other modes unaffected.
4. Check victory scoring / saved scores as regression QA.
5. Feedback determines if changes are worth including in a later release. Do not automatically merge draft PR or change main.

Signing remains the same private Android *test* key, application ID com.hoseantonio85.signalbreach and monotonically increasing versionCode 2008. RuStore production signing will use a different key.

## Промежуточная обратная связь, 2026-11-03
Игрок тестирует `0.2.8`, после небольшой игры сообщил, что «вроде нормально», однако текущую OP 04 **ещё не завершил**. В исследовании ранних миссий подтверждены отдельные неизбежные угадывания даже в OP 01–05; для классического случайного Minesweeper они возможны. **Не считать тест баланса законченным; не менять минные параметры до более продолжительного прохождения OP 04–08.** Необходимо отдельно оценить UX горизонтального скролла (на двух скриншотах OP 04 карта показана в разных горизонтальных положениях). Без одобрения пользователя PR #16 не объединять.
