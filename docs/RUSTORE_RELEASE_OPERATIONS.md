# SIGNAL // BREACH — RuStore v1: выпуск APK и ключи

**Статус:** инструкция для подготовки. Реальный production key и подписанный release APK пока **не созданы**. Workflow: `.github/workflows/rustore-release.yml`.

## Утверждённые границы

- Продукт: бесплатная офлайн-игра на React/Capacitor; версия для первого магазина — **предлагаемая 1.0.0**.
- Android package ID **пока не менять**: `com.hoseantonio85.signalbreach`. Перед первой загрузкой проверить уникальность в RuStore Console и окончательно утвердить identity.
- Для v1 использовать **APK**, а не AAB: это поддерживаемый RuStore формат и не требует отдельной AAB-процедуры подписи.
- Тестовые GitHub APK 0.2.x продолжат подписываться нынешним тестовым сертификатом; production использует **другой, отдельный** ключ.
- **Решение владельца 2026-11-06:** прогресс установленной тестовой игры не требует переноса. Удаление тестовой APK перед первой production-установкой разрешено с предупреждением, что сохранения пропадут. Никакой новый UI резервного кода не нужен.
- **Критично:** после первой production-публикации сохранить **один и тот же** ключ и applicationId для всех последующих обновлений, иначе переход v1.0.0→v1.0.1 сломается.

## Создание релизного ключа — на доверенном компьютере

Не запускать эти команды в публичном CI и не коммитить получившийся файл. После отдельного согласования первой production identity создать **один** keystore и сохранить резервную копию в приватном хранилище, доступ к которому не зависит от GitHub Actions.

```sh
keytool -genkeypair -v \
  -keystore signal-breach-rustore-release.jks \
  -alias signalbreach-release \
  -keyalg RSA -keysize 3072 -validity 10000 \
  -dname "CN=SIGNAL BREACH Release,O=SIGNAL BREACH"
```

Ввести **уникальные сильные пароли**, не использовать `android`, тестовый ключ или общедоступные пароли. Не публиковать оригинальный `.jks`, base64, пароли и бэкап в GitHub, комментариях, релизах или общих папках.

Для сертификата и секретов:

```sh
keytool -list -v -keystore signal-breach-rustore-release.jks -alias signalbreach-release
# Перенести только публичный отпечаток SHA256 в GitHub Actions variable
base64 -w 0 signal-breach-rustore-release.jks
# Только для закрытого ввода GitHub secret (не копировать в issue или лог)
```

**GitHub → Settings → Secrets and variables → Actions**

| Тип | Название | Значение |
|---|---|---|
| Secret | `SIGNAL_BREACH_RELEASE_KEYSTORE_B64` | base64 оригинального production JKS |
| Secret | `SIGNAL_BREACH_RELEASE_KEY_ALIAS` | `signalbreach-release` или фактический alias |
| Secret | `SIGNAL_BREACH_RELEASE_STORE_PASSWORD` | пароль keystore |
| Secret | `SIGNAL_BREACH_RELEASE_KEY_PASSWORD` | пароль ключа |
| Variable | `SIGNAL_BREACH_RELEASE_CERT_SHA256` | публичный SHA-256 отпечаток сертификата из `keytool` |

Удалить временные файлы с base64 сразу после настройки. Оригинальный JKS и пароли должны пережить потерю GitHub-аккаунта и доступность CI. Не использовать существующий `SIGNAL_BREACH_DEBUG_KEYSTORE_B64`.

## Безопасный процесс CI

1. PR из `prep/rustore-release-candidate` выполняет web/Android проверки и **`./gradlew assembleRelease`** на временном runner. **Без production secrets, без подписанного APK**, без отправки в RuStore.
2. Проверить PR, CI, apk manifest, лицензионные зависимости и UX. Лишь после одобрения merge в `main`. Ветка `main` по-прежнему публикует тестовые pre-release, поэтому **не повышать `package.json` до 1.0.0**, пока не будет отдельного согласованного релизного среза.
3. На выделенном выпуске поднять `package.json` до `1.0.0`, убедиться в целевых кодах (формула: `versionCode=1000000`). Проверить, что текущий GitHub debug pre-release не будет ошибочно принят за RuStore.
4. Создать и проверить **production** secrets; запустить вручную `Actions → RuStore release candidate → Run workflow` из `main`. Workflow собирает настоящий release, проверяет `debuggable`, zipalign, APK signer fingerprint, package, `versionCode`, `versionName`, выводит фактические permissions и SHA-256 APK.
5. Скачать из **Artifacts** `signal-breach-rustore-release-candidate`. Артефакт хранится 7 суток. Не публиковать его как общедоступный GitHub Release без отдельного решения; workflow **не обращается** к RuStore API.
6. Установить на чистый Android / тестовый профиль. Допускается удалить прежнюю тестовую APK **после явного предупреждения** (из-за другого сертификата); данные тестовой установки не мигрируют.
7. На production-профиле проверить: офлайн, обе локали, управление касаниями, OP и Free Run, два вида меток, Back, результат/Native Share, автосохранение, пауза/фон, звук, иконка/splash.
8. Сделать отдельную **production** тестовую `1.0.1` тем же ключом, установить **поверх** 1.0.0 без удаления, проверить сохранения и текущую партию. Не отправлять проверочную 1.0.1 в магазин автоматически.
9. Сверить карточку, возрастную маркировку, реальный Manifest и требования к данным. **Только по отдельному одобрению владельца** загрузить APK и отправить на модерацию.

## Отдельные выпускные ограничения

- Тестовый APK `assembleDebug` нельзя переименовать в production релиз. Проверять `android:debuggable=false` именно у `assembleRelease`.
- Android `android/ ` генерируется в CI; изменения нативной конфигурации должны воспроизводиться скриптами. После первой успешной CI сборки проверить в финальном APK `minSdkVersion`, `targetSdkVersion`, permissions, launcher assets, содержимое `assets/public` и WebView offline.
- `npm install` пока используется без lockfile. До окончательной публикации желательно зафиксировать версии зависимостей и воспроизводимость CI (`npm ci`); этот пункт ещё открыт.
- GitHub Actions artifact — **не** загрузка в RuStore, **не** модерация и **не** публикация. Сначала реальный Android QA и аккаунт разработчика.

## Источники

- [RuStore — публикация APK и AAB](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication)
- [RuStore — подписи приложений](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/apk-signature)
- [RuStore — требования к приложениям](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/requirement-apps)
