# SIGNAL//BREACH

Атмосферный synthwave/cyberpunk «Сапёр»: сюжетная кампания, Free Run, русский и английский языки, Android и браузер.

**Играть в браузере:** https://hoseantonio85-art.github.io/signal-breach/

**Скачать Android:** [GitHub Releases](https://github.com/hoseantonio85-art/signal-breach/releases). Пока публикуются **тестовые предварительные APK**, а не финальные RuStore-релизы. Новые тестовые APK устанавливаются поверх предыдущих с сохранением прогресса, если используется одинаковая подпись.

**Текущая версия:** 0.2.10. Баланс поздних операций сглажен; янтарный карантин отделён от подтверждённых красных мин. Полная проверка OP 09–10, звука и подготовка RuStore ещё впереди.

> Продолжение проекта: [START_HERE.md](docs/START_HERE.md) · [ROADMAP.md](docs/ROADMAP.md) · [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

## Технологии

- React 19 + TypeScript — интерфейс и игровой движок;
- Vite 7 — сборка игры для Web и Android;
- CSS — интерфейс, эффекты и анимация;
- Web Audio API — синтез звуков;
- Capacitor 8 — Android WebView, нативная отправка результатов;
- GitHub Actions — тесты, публикация Pages, сборка и проверка APK.

Одна кодовая база используется для Android и для браузера.

## Архитектура

- src/game — игровой движок;
- src/screens — экраны;
- src/campaign — параметры миссий и сюжет;
- src/i18n — русский и английский;
- src/stores — настройки и прогресс;
- src/audio — звуки;
- tests — регрессионные тесты;
- docs — документация и QA.

## Запуск

    npm install
    npm run dev

Проверка веб-сборки:

    npm run build

Подготовка Android-ассетов:

    npm run build:android

## Публикация

Каждый push в main обновляет веб-версию на GitHub Pages. Android Actions собирает APK, проверяет сертификат подписи **самого конечного файла** и, после успешной проверки, автоматически создаёт новый **GitHub pre-release** с APK в разделе Releases. Версия и тег берутся из package.json.

**Важно:** тестовый Android keystore хранится приватно, не в репозитории. В RuStore будет отдельная политика релизной подписи. Перед новым выпуском обязательно увеличивать версию, чтобы обновление устанавливалось поверх предыдущей.
