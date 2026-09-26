import type { Mission } from '../game/types'

export const missions: Mission[] = [
  {
    id: 1, code: 'WAKE PROTOCOL', rows: 8, cols: 8, mines: 8, parSeconds: 45,
    location: { ru: 'Учебный ретранслятор / Сектор 7', en: 'Training Relay / Sector 7' },
    briefing: { ru: 'Оператор, начнём с локального контура. Найдите заражённые узлы и изолируйте их, не разрывая чистые каналы.', en: 'Operator, we start with a local loop. Find the corrupted nodes and isolate them without severing clean channels.' },
    debrief: { ru: 'Контур восстановлен. Сигнатура заражения слишком упорядочена для случайного сбоя.', en: 'Loop restored. The corruption signature is too orderly to be a random failure.' },
  },
  {
    id: 2, code: 'GHOST PACKET', rows: 9, cols: 9, mines: 10, parSeconds: 65,
    location: { ru: 'Гражданская сеть / Узел 12', en: 'Civic Mesh / Node 12' },
    briefing: { ru: 'В гражданской сети появился пакет без источника. Он оставляет за собой повреждённые узлы. Восс просит пройти контур вручную.', en: 'A source-less packet has appeared in the civic mesh, leaving corrupted nodes behind. Voss wants a manual trace.' },
    debrief: { ru: 'Пакет исчез, но оставил повторяющийся ритм. SIGNAL присваивает сигнатуре имя NULL CHOIR.', en: 'The packet vanished, but left a repeating cadence. SIGNAL designates the signature NULL CHOIR.' },
  },
  {
    id: 3, code: 'GLASS HARBOR', rows: 10, cols: 10, mines: 16, parSeconds: 90,
    location: { ru: 'Логистическая сеть / Портовый слой', en: 'Logistics Grid / Port Layer' },
    briefing: { ru: 'NULL CHOIR вошёл в портовую автоматику. Изолируйте заражение до того, как маршрутизация грузов начнёт принимать ложные команды.', en: 'NULL CHOIR entered port automation. Isolate the breach before cargo routing starts accepting false commands.' },
    debrief: { ru: 'Порт стабилен. Аномалия явно ищет инфраструктуру, где ошибка быстро становится физическим событием.', en: 'The port is stable. The anomaly is clearly seeking infrastructure where a digital error becomes physical quickly.' },
  },
  {
    id: 4, code: 'NIGHT GRID', rows: 11, cols: 11, mines: 22, parSeconds: 120,
    location: { ru: 'Метро / Глубокая линия', en: 'Metro Routing / Deep Line' },
    briefing: { ru: 'Ночная ветка метро ушла в резервный режим. Восстановите карту узлов раньше, чем диспетчерские контуры потеряют синхронизацию.', en: 'A night metro line fell into fallback mode. Restore the node map before dispatch loops lose synchronization.' },
    debrief: { ru: 'Маршруты удержаны. NULL CHOIR начал отвечать на наши действия — это уже не пассивное заражение.', en: 'Routes held. NULL CHOIR has started reacting to our moves. This is no longer passive corruption.' },
  },
  {
    id: 5, code: 'PALE ORBIT', rows: 12, cols: 12, mines: 28, parSeconds: 150,
    location: { ru: 'Орбитальный канал / Метеомассив', en: 'Orbital Link / Weather Array' },
    briefing: { ru: 'Сигнатура достигла орбитального канала. Ошибка в одном узле может исказить целый массив телеметрии.', en: 'The signature reached an orbital channel. A single bad node can distort an entire telemetry array.' },
    debrief: { ru: 'Орбитальный канал чист. Восс считает, что противник проверяет пределы нашей реакции.', en: 'Orbital channel clean. Voss believes the adversary is testing the limits of our response.' },
  },
  {
    id: 6, code: 'DEAD CURRENT', rows: 13, cols: 13, mines: 35, parSeconds: 190,
    location: { ru: 'Энергобаланс / Кольцо 4', en: 'Energy Balance / Ring 4' },
    briefing: { ru: 'Энергокольцо заражено неравномерно. Не гонитесь за скоростью — одна ошибка откроет каскад.', en: 'The energy ring is corrupted unevenly. Do not chase speed; one mistake can open a cascade.' },
    debrief: { ru: 'Кольцо удержано. В заражении найден обратный канал — кто-то наблюдал за восстановлением.', en: 'The ring held. We found a return channel inside the corruption. Someone was watching the recovery.' },
  },
  {
    id: 7, code: 'CHOIR SIGNATURE', rows: 14, cols: 14, mines: 45, parSeconds: 230,
    location: { ru: 'Архивная магистраль / Хранилище 3', en: 'Archive Backbone / Vault 3' },
    briefing: { ru: 'Мы нашли устойчивый отпечаток NULL CHOIR в архивной магистрали. Это шанс отследить происхождение сигнала.', en: 'We found a persistent NULL CHOIR fingerprint in the archive backbone. This is our chance to trace its origin.' },
    debrief: { ru: 'След ведёт не наружу, а глубже в сеть SIGNAL. Восс переводит операцию в закрытый протокол.', en: 'The trail does not lead outside. It goes deeper into the SIGNAL network. Voss moves the operation to a sealed protocol.' },
  },
  {
    id: 8, code: 'MIRROR GATE', rows: 15, cols: 15, mines: 55, parSeconds: 280,
    location: { ru: 'Ретранслятор поселения / Зеркальный слой', en: 'Settlement Relay / Mirror Layer' },
    briefing: { ru: 'Зеркальный слой копирует повреждения между сегментами. Работайте по фактической карте, а не по ожидаемому паттерну.', en: 'The mirror layer is copying damage between segments. Work from the actual map, not the expected pattern.' },
    debrief: { ru: 'Зеркало закрыто. NULL CHOIR попытался замаскировать исходный контур за нашей собственной телеметрией.', en: 'Mirror closed. NULL CHOIR tried to hide its origin behind our own telemetry.' },
  },
  {
    id: 9, code: 'BLACK ICE', rows: 16, cols: 16, mines: 65, parSeconds: 340,
    location: { ru: 'Контрмеры / Ретранслятор 0', en: 'Countermeasure Layer / Relay 0' },
    briefing: { ru: 'Ретранслятор 0 отвечает агрессивной защитой. Каждый открытый канал может быть приманкой. Держите карту под контролем.', en: 'Relay 0 is responding with aggressive countermeasures. Every open channel may be bait. Keep the map under control.' },
    debrief: { ru: 'BLACK ICE снят. За ним находится узел, которого нет ни в одной официальной схеме SIGNAL.', en: 'BLACK ICE is down. Behind it sits a node that exists in no official SIGNAL topology.' },
  },
  {
    id: 10, code: 'ZERO SIGNAL', rows: 16, cols: 18, mines: 80, parSeconds: 420,
    location: { ru: 'Ядро ретранслятора / Источник', en: 'Core Relay / Origin' },
    briefing: { ru: 'Это источник. Если NULL CHOIR действительно возник внутри нашего контура, здесь останется ответ. Или ловушка.', en: 'This is the source. If NULL CHOIR truly originated inside our network, the answer is here. Or the trap is.' },
    debrief: { ru: 'Источник изолирован, но сигнал не исчез. Последняя строка телеметрии пришла уже после отключения узла.', en: 'The source is isolated, but the signal did not disappear. The final telemetry line arrived after the node was offline.' },
  },
]
