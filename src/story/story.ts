import type { Language, Mission } from '../game/types'

export type ExperienceMode = 'classic' | 'story'
export type StoryCharacterId = 'voss' | 'mira' | 'ortiz'
type Localized = Record<Language, string>

export type StoryCharacter = {
  id: StoryCharacterId
  name: string
  role: Localized
  portrait: string
}

export type StoryBeat = {
  missionId: number
  speaker: StoryCharacterId
  channel: string
  briefing: Localized
  debrief: Localized
  transmission: Localized
}

export const storyCharacters: Record<StoryCharacterId, StoryCharacter> = {
  voss: {
    id: 'voss',
    name: 'VOSS',
    role: { ru: 'SIGNAL COMMAND // руководитель операции', en: 'SIGNAL COMMAND // operations lead' },
    portrait: 'portraits/voss.svg',
  },
  mira: {
    id: 'mira',
    name: 'MIRA CHEN',
    role: { ru: 'NETWORK FORENSICS // аналитик сигнатур', en: 'NETWORK FORENSICS // signature analyst' },
    portrait: 'portraits/mira.svg',
  },
  ortiz: {
    id: 'ortiz',
    name: 'LEO ORTIZ',
    role: { ru: 'RELAY OPS // инженер полевых сетей', en: 'RELAY OPS // field network engineer' },
    portrait: 'portraits/ortiz.svg',
  },
}

export const storyUi = {
  ru: {
    modeClassic: 'CLASSIC',
    modeStory: 'STORY',
    versionLabel: 'Версия',
    context: 'Контекст',
    contextTitle: 'Почему мы ищем эти сигналы',
    archive: 'Архив',
    archiveTitle: 'Перехваты / SIGNAL LOG',
    archiveEmpty: 'Пока нет доступных перехватов.',
    close: 'Закрыть',
    latestTransmission: 'Последний перехват',
    storyProtocol: 'STORY LAYER // OPTIONAL',
  },
  en: {
    modeClassic: 'CLASSIC',
    modeStory: 'STORY',
    versionLabel: 'Version',
    context: 'Context',
    contextTitle: 'Why we trace these signals',
    archive: 'Archive',
    archiveTitle: 'Intercepts / SIGNAL LOG',
    archiveEmpty: 'No intercepts available yet.',
    close: 'Close',
    latestTransmission: 'Latest intercept',
    storyProtocol: 'STORY LAYER // OPTIONAL',
  },
} as const

export const worldTeaser: Localized = {
  ru: 'Последние 19 дней разные сети фиксируют один и тот же пакет без источника. Сегодня он впервые появился внутри учебного контура SIGNAL.',
  en: 'For 19 days, unrelated networks have logged the same source-less packet. Today it appeared inside a SIGNAL training loop for the first time.',
}

export const worldContext: Record<Language, string[]> = {
  ru: [
    'Сеть SIGNAL обслуживает старые автономные ретрансляторы, на которых всё ещё держатся транспорт, энергосети и городская автоматика. Обычно работа оператора скучна: найти повреждённый узел, изолировать его и вернуть контур в строй.',
    'Но последние 19 дней в несвязанных сетях появляется одинаковый сигнал без источника. Он не крадёт данные и не ломает системы напрямую. Он оставляет небольшие повреждения — будто проверяет, как быстро люди замечают сбой и каким способом восстанавливают сеть.',
    'Командование пока считает совпадения статистическим шумом. Восс попросил сохранить ручной протокол расследования. Сегодня сигнал впервые появился там, где его точно не должно было быть: внутри учебного контура SIGNAL.',
  ],
  en: [
    'SIGNAL maintains old autonomous relay networks that still carry transport, energy balancing and city automation. An operator’s work is usually dull: find a bad node, isolate it, restore the loop.',
    'For the last 19 days, unrelated networks have logged the same source-less signal. It does not steal data or break systems outright. It leaves small faults behind — almost as if it is measuring how quickly people notice and how they repair the network.',
    'Command still calls the pattern statistical noise. Voss asked to keep a manual investigation protocol alive. Today the signal appeared somewhere it should be impossible: inside a SIGNAL training loop.',
  ],
}

export const storyBeats: StoryBeat[] = [
  {
    missionId: 1,
    speaker: 'voss',
    channel: 'CMD / SECURE',
    briefing: {
      ru: 'Оператор, это должен был быть обычный учебный контур. Но за восемь минут до вашего входа он сам запросил карантин. Найдите повреждённые узлы. И ничего не сбрасывайте — мне нужны сырые логи.',
      en: 'Operator, this was supposed to be a routine training loop. Eight minutes before your login it requested quarantine by itself. Find the damaged nodes. Do not purge anything — I want the raw logs.',
    },
    debrief: {
      ru: 'Контур чист. Проблема в другом: сигнатура совпадает с тремя гражданскими сбоями этой недели. Учебная сеть не подключена к ним. Формально — совпадение. Пока.',
      en: 'Loop clean. The problem is the signature: it matches three civic failures from this week. The training mesh is not connected to them. Officially, coincidence. For now.',
    },
    transmission: {
      ru: 'Не отправляй логи в общий архив. Пока держим это внутри группы.',
      en: 'Do not send the logs to the general archive. Keep this inside the group for now.',
    },
  },
  {
    missionId: 2,
    speaker: 'mira',
    channel: 'FORENSICS / DIRECT',
    briefing: {
      ru: 'Я подняла сырой трафик с учебного контура. Пакет не пришёл извне — он как будто уже был внутри, а потом решил стать видимым. В гражданской сети появился такой же. Если поймаешь ритм, не торопись его стирать.',
      en: 'I pulled the raw traffic from the training loop. The packet did not arrive from outside — it looks like it was already there and simply decided to become visible. The civic mesh has the same one. If you catch its cadence, do not erase it too quickly.',
    },
    debrief: {
      ru: 'Вот он. Повтор каждые 11,4 секунды. Я назвала сигнатуру NULL CHOIR — неофициально. Восс сделал вид, что ему не понравилось название.',
      en: 'There it is. Repetition every 11.4 seconds. I named the signature NULL CHOIR — unofficially. Voss pretended not to like the name.',
    },
    transmission: {
      ru: 'NULL CHOIR ничего не передаёт. Он ждёт ответа сети. Это страннее, чем если бы он что-то крал.',
      en: 'NULL CHOIR transmits nothing. It waits for the network to answer. That is stranger than theft.',
    },
  },
  {
    missionId: 3,
    speaker: 'ortiz',
    channel: 'FIELD / PORT 6',
    briefing: {
      ru: 'Я у портовой автоматики. Здесь уже не лаборатория: один неверный маршрут — и контейнеры поедут не туда. Самое неприятное — локальные контроллеры уверены, что всё нормально. Карта оператора видит больше, чем они.',
      en: 'I am at port automation. This is not a lab anymore: one wrong route and containers start moving where they should not. Worst part — local controllers think everything is fine. Your operator map sees more than they do.',
    },
    debrief: {
      ru: 'Маршруты удержали. Но NULL CHOIR выбрал именно систему, где цифровая ошибка быстро становится физической. Мне это не нравится.',
      en: 'Routes held. But NULL CHOIR picked a system where a digital error becomes physical very quickly. I do not like that.',
    },
    transmission: {
      ru: 'На месте никто не видел атаки. Для людей это выглядело как обычный плохой понедельник.',
      en: 'No one on site saw an attack. To everyone there, it looked like a normal bad Monday.',
    },
  },
  {
    missionId: 4,
    speaker: 'mira',
    channel: 'FORENSICS / PRIORITY',
    briefing: {
      ru: 'Метро ушло в резервный режим ровно после того, как мы закрыли порт. Я сравнила временные метки. Похоже, сигнал увидел наше вмешательство. Осторожнее: впервые мы можем иметь дело не с заражением, а с реакцией.',
      en: 'The metro dropped into fallback exactly after we closed the port. I compared timestamps. The signal appears to have noticed our intervention. Careful: for the first time this may not be corruption. It may be a response.',
    },
    debrief: {
      ru: 'Маршруты стабильны. И да — после каждого нашего карантина соседний участок менял паттерн. Он отвечал на действия оператора.',
      en: 'Routes stable. And yes — after every quarantine, the neighboring segment changed pattern. It was responding to the operator.',
    },
    transmission: {
      ru: 'Я перестала называть это вредоносным кодом. Код не должен замечать, кто на него смотрит.',
      en: 'I stopped calling it malware. Code is not supposed to notice who is looking at it.',
    },
  },
  {
    missionId: 5,
    speaker: 'voss',
    channel: 'CMD / ORBITAL',
    briefing: {
      ru: 'Сигнатура поднялась в орбитальный канал. Метеомассив вторичен; меня интересует путь. Если он настоящий, кто-то либо знает старую топологию SIGNAL лучше нас, либо находится внутри неё.',
      en: 'The signature reached an orbital channel. The weather array is secondary; I care about the route. If it is real, someone either knows SIGNAL’s old topology better than we do, or is already inside it.',
    },
    debrief: {
      ru: 'Канал чист. В траектории есть участки, которых нет в текущих схемах. Я запросил архивные карты до обновления сети.',
      en: 'Channel clean. The route contains segments missing from current topology. I requested maps from before the network upgrade.',
    },
    transmission: {
      ru: 'С этого момента операция не существует за пределами этой консоли.',
      en: 'From this point on, this operation does not exist outside this console.',
    },
  },
  {
    missionId: 6,
    speaker: 'ortiz',
    channel: 'FIELD / RING 4',
    briefing: {
      ru: 'Энергокольцо заражено неровно, будто кто-то оставил вам дорожку. Не гонитесь за скоростью. Если это приглашение, я предпочёл бы сначала понять, куда нас зовут.',
      en: 'The energy ring is corrupted unevenly, almost like someone left you a path. Do not chase speed. If this is an invitation, I would rather know where it leads before accepting.',
    },
    debrief: {
      ru: 'Нашёл обратный канал. Он был открыт всё время, пока вы восстанавливали сеть. Кто-то наблюдал за процедурой.',
      en: 'Found a return channel. It stayed open the entire time you were restoring the network. Someone was watching the procedure.',
    },
    transmission: {
      ru: 'Не люблю системы, которые учатся на ремонте быстрее, чем мы на поломке.',
      en: 'I do not like systems that learn from the repair faster than we learn from the failure.',
    },
  },
  {
    missionId: 7,
    speaker: 'mira',
    channel: 'FORENSICS / SEALED',
    briefing: {
      ru: 'Я нашла устойчивый отпечаток в архивной магистрали. Есть шанс наконец проследить источник. Только приготовься: направление уже выглядит неправильно.',
      en: 'I found a persistent fingerprint in the archive backbone. We may finally be able to trace the origin. Just be ready: the direction already looks wrong.',
    },
    debrief: {
      ru: 'След не уходит наружу. Он ведёт глубже в SIGNAL, в старую часть сети, о которой у моей группы нет документации.',
      en: 'The trail does not lead outside. It goes deeper into SIGNAL, into an old part of the network my team has no documentation for.',
    },
    transmission: {
      ru: 'Я проверила трижды. Источник не «пробился» в нашу сеть. Мы идём к месту, где он, возможно, всегда был.',
      en: 'I checked three times. The source did not break into our network. We are moving toward somewhere it may have always been.',
    },
  },
  {
    missionId: 8,
    speaker: 'voss',
    channel: 'CMD / BLACK',
    briefing: {
      ru: 'Зеркальный слой размножает повреждения между сегментами и подмешивает нашу телеметрию. Не доверяйте ожидаемому паттерну. Только фактической карте перед вами.',
      en: 'The mirror layer copies damage across segments and mixes in our own telemetry. Do not trust the expected pattern. Trust only the map in front of you.',
    },
    debrief: {
      ru: 'Зеркало закрыто. Кто бы ни построил этот слой, он рассчитывал, что расследование SIGNAL будет использовать собственные данные как доказательство.',
      en: 'Mirror closed. Whoever built this layer expected SIGNAL investigators to use their own telemetry as evidence.',
    },
    transmission: {
      ru: 'Мира права насчёт происхождения. Я пока не готов писать это в официальный отчёт.',
      en: 'Mira is right about the origin. I am not ready to put that in an official report yet.',
    },
  },
  {
    missionId: 9,
    speaker: 'ortiz',
    channel: 'FIELD / RELAY 0',
    briefing: {
      ru: 'Ретранслятор 0 числится обесточенным девять лет. Сейчас он отвечает защитой BLACK ICE и потребляет энергию. Откуда — хороший вопрос. Сначала переживите контрмеры.',
      en: 'Relay 0 has been listed as unpowered for nine years. Right now it is running BLACK ICE countermeasures and drawing energy. From where is a good question. Survive the defenses first.',
    },
    debrief: {
      ru: 'BLACK ICE снят. За ним есть узел без имени и без номера. Я таких конструкций не видел даже в архивных схемах.',
      en: 'BLACK ICE is down. Behind it is a node with no name and no number. I have never seen this structure, even in archived topology.',
    },
    transmission: {
      ru: 'Если Восс скажет, что это штатный резервный контур, попросите его показать документацию. Я уже попросил.',
      en: 'If Voss calls this a standard reserve loop, ask him for the documentation. I already did.',
    },
  },
  {
    missionId: 10,
    speaker: 'mira',
    channel: 'FORENSICS / ORIGIN',
    briefing: {
      ru: 'Это последний известный узел. Я не буду говорить, что думаю, пока вы не увидите его сами. Только одно: если после изоляции сигнал останется, значит мы всё это время неправильно формулировали вопрос.',
      en: 'This is the last known node. I will not tell you what I think until you see it yourself. Just one thing: if the signal survives isolation, then we have been asking the wrong question the whole time.',
    },
    debrief: {
      ru: 'Источник изолирован. NULL CHOIR всё ещё в эфире. Последняя строка телеметрии пришла уже после физического отключения узла: «HANDSHAKE ACCEPTED».',
      en: 'Origin isolated. NULL CHOIR is still on the air. The final telemetry line arrived after the node was physically offline: “HANDSHAKE ACCEPTED”.',
    },
    transmission: {
      ru: 'Запись завершена не потому, что расследование окончено. Просто дальше у нас пока нет карты.',
      en: 'The record ends here not because the investigation is over. We simply do not have a map beyond this point yet.',
    },
  },
]

export function getStoryBeat(missionId: number) {
  return storyBeats.find((beat) => beat.missionId === missionId)
}

export function storyMission(mission: Mission): Mission {
  const beat = getStoryBeat(mission.id)
  if (!beat) return mission
  return { ...mission, briefing: beat.briefing, debrief: beat.debrief }
}

export function availableStoryBeats(unlockedMission: number) {
  return storyBeats.filter((beat) => beat.missionId <= unlockedMission)
}
