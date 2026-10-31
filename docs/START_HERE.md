# SIGNAL//BREACH — продолжение работы из нового чата

**Актуально на 2026-11-01.** Это короткая точка входа и источник текущего статуса. Прежде чем что-либо менять, **снова проверь текущее состояние `main`, открытых PR и GitHub Actions**: с момента последнего обновления файла ситуация могла измениться.

## Что это за проект
- Атмосферный synthwave/cyberpunk-сапёр SIGNAL//BREACH: 10 сюжетных операций, 3 режима Free Run, языки RU/EN, звук и адаптивная веб-версия.
- Стек: React 19, TypeScript, Vite, Lucide, собственный игровой движок `src/game/engine.ts`.
- Цель следующего этапа — **первый полностью офлайн debug APK для Android**, затем надёжное сохранение/пауза/Back, QA, подготовка бесплатного релиза в RuStore. Без рекламы, серверов, аккаунтов и покупок.

## Где остановились
- [PR #2](https://github.com/hoseantonio85-art/signal-breach/pull/2) **объединён**: мобильные жесты, карточки, метрики `СЕТКА 8×8` / `GRID 8×8`, шрифт Unbounded в веб-версии, цвета и иконки, единое состояние звука.
- [PR #3](https://github.com/hoseantonio85-art/signal-breach/pull/3) **объединён**: исправление проигрыша при chord, 6 поведенческих тестов движка, общий `AudioToggle`, аудит Android.
- Последний проверенный merge PR #3: [`560120a`](https://github.com/hoseantonio85-art/signal-breach/commit/560120af932d0dbb7f2175628385acdb9144b80b). Позже в `main` могли появиться коммиты документации или другие изменения — не использовать SHA как постоянную базу.
- Основная игра: https://hoseantonio85-art.github.io/signal-breach/ . Путь `/preview/` — исторический UX preview, **не** новый Android-прототип.
- **R1 начат** в [draft PR #4](https://github.com/hoseantonio85-art/signal-breach/pull/4), ветка `release/android-rustore-v1`: есть Capacitor-зависимости, режим Android с относительными URL, локальный Unbounded и GitHub Actions. Утверждён `applicationId = com.hoseantonio85.signalbreach` (2026-11-01). **Первый Android debug APK собран успешно:** [Actions run 41243617194](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41243617194), artifact `signal-breach-android-debug` (ZIP с `app-debug.apk`, до 2026-11-14). Реальный телефон и офлайн-режим ещё не протестированы. См. [ANDROID_BUILD.md](ANDROID_BUILD.md).
- `npm run build` и `npm run build:android` прошли в PR #4; Android Gradle `assembleDebug` и выгрузка APK прошли в [run 41243617194](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41243617194).
- Важное ограничение: настоящий Android WebView и визуальный QA на устройстве **ещё не выполнены**.

## Обновление 2026-11-01: фирменная Android-иконка и QA операций
- В [draft PR #4](https://github.com/hoseantonio85-art/signal-breach/pull/4) добавлен генератор фирменной Android launcher-иконки (точный мотив меню: бирюзовый ромб и заполненный розовый квадрат) для legacy/round/adaptive/monochrome. **[Actions run 41247085110](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41247085110) успешно собрал APK** с новой иконкой; визуальный QA на устройстве остаётся.
- **Не удалять установленный первый тестовый APK при наличии ценного прогресса** (игрок дошёл до OP 08): CI debug keystore может отличаться между сборками, установка поверх может не сработать, а удаление очистит локальные сохранения. Перед обновлением нужна защищённая миграция/экспорт прогресса и стабильная тестовая подпись. См. [#7](https://github.com/hoseantonio85-art/signal-breach/issues/7).
- По обратной связи игрока с OP 07 появляются ситуации угадывания; OP 08 пока ни разу не завершена. **Генератор не гарантирует решаемость без угадывания.** Завели [#8](https://github.com/hoseantonio85-art/signal-breach/issues/8) на измерение и тесты перед изменением сложности; сканер остаётся отдельной гипотезой [#6](https://github.com/hoseantonio85-art/signal-breach/issues/6).

## Следующее конкретное действие (R1 — в работе)
1. **Выполнено:** создана `release/android-rustore-v1` от `main` (`625b5f0` на старте).
2. **Подготовлено:** Capacitor 8, отдельный `vite build --mode android` с `base: './'`; нативный проект генерируется в CI после утверждения ID. Веб-base `/signal-breach/` сохраняется.
3. **Выполнено в коде:** локальный Unbounded WOFF2 через Fontsource, лицензия OFL; Android исключает удалённые Tektur/Russo. Офлайн ещё проверить на телефоне.
4. **Выполнено:** утверждён `applicationId = com.hoseantonio85.signalbreach`, настроен workflow, первый APK собран. [Скачать в разделе Artifacts](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41243617194) — `signal-breach-android-debug`. **Следующий шаг:** установить APK и проверить офлайн на телефоне.
5. Проверить установку и работу офлайн, RU/EN, звук, старт операции, большие карты, safe areas. **Не считать** отсутствие Android-девайсного QA подтверждением качества.
6. Оформить отдельный PR. Сливать Android-код в `main` только после успешных проверок и согласования владельца.

**Результат R1:** первый устанавливаемый debug APK из GitHub Actions, воспроизводимый билд, игра запускается без сети и веб-версия не регрессировала.

## После первого APK
- **R2 — надёжность:** версионированное сохранение текущей партии, пауза таймера и AudioContext при уходе в фон, восстановление после убийства процесса, системная Android Back, подтверждение потери сессии.
- **R3 — QA:** телефоны разных размеров (особенно 320/360/390 dp), все 10 миссий и три Free Run, длинное нажатие и панорамирование 16×30, навигация, airplane mode, производительность.
- **Рефакторинг только с пользой:** `GameScreen.tsx` можно разделить на `GameBoard`, `GameHUD`, `useCellInput`, `ResultOverlay`, но поэтапно после тестов; не переделывать UI ради самого разделения. `AudioToggle`, `MissionCard`, `MissionMetrics` уже выделены.
- **R4 — RuStore:** иконка, splash, финальные имя и package ID, материалы магазина, privacy/data disclosures, подписанная release-сборка, защищённое хранение keystore.

## Главные ссылки
- [План с чекбоксами](ROADMAP.md) — **главный перечень этапов и статусов**
- [Технический аудит](ANDROID_READINESS_AUDIT.md) — проблемы, приоритеты, предложения по компонентам
- [Release Checklist](RELEASE_CHECKLIST.md) — критерии QA и релиза
- [UI-архитектура](UI_ARCHITECTURE.md) — компоненты и принятые UI-инварианты
- [Решения](DECISIONS.md) — зафиксированные UX-решения и терминология
- [Документация проекта](README.md) — правила работы с ветками

## Правила работы
- `main` — стабильная веб-версия. Никакого скрытого merge.
- Для существенных правок — отдельная ветка/PR, проверка Actions и краткий QA.
- Не ломать текущую игру; изменять паттерны на основе проверенной потребности.
- После каждого этапа обновлять **этот файл и ROADMAP.md**, указывая выполненное, что остаётся и ссылки на PR/APK.

## Текст для нового чата
> Продолжаем SIGNAL//BREACH, репозиторий https://github.com/hoseantonio85-art/signal-breach . Сначала прочитай `docs/START_HERE.md`, `docs/ROADMAP.md` и `docs/ANDROID_READINESS_AUDIT.md` из актуального `main`, проверь PR и CI. Работаем над первым офлайн Android debug APK через Capacitor в отдельной ветке; основной Pages не ломаем и без моего согласия не мержим. Продолжай с текущего незавершённого пункта R1.
