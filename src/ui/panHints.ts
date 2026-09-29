const EPSILON = 2

function syncPanHints(shell: HTMLElement) {
  const map = shell.closest('.pannable-map')
  const hints = map?.querySelector<HTMLElement>('.pan-hints')
  if (!hints) return

  const maxLeft = Math.max(0, shell.scrollWidth - shell.clientWidth)
  const maxTop = Math.max(0, shell.scrollHeight - shell.clientHeight)

  hints.classList.toggle('can-pan-left', shell.scrollLeft > EPSILON)
  hints.classList.toggle('can-pan-right', shell.scrollLeft < maxLeft - EPSILON)
  hints.classList.toggle('can-pan-top', shell.scrollTop > EPSILON)
  hints.classList.toggle('can-pan-bottom', shell.scrollTop < maxTop - EPSILON)
}

function syncAllPanHints() {
  document.querySelectorAll<HTMLElement>('.pannable-map .board-shell').forEach(syncPanHints)
}

let frame = 0
function scheduleSync() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(syncAllPanHints)
}

document.addEventListener(
  'scroll',
  (event) => {
    const target = event.target
    if (target instanceof HTMLElement && target.matches('.pannable-map .board-shell')) {
      syncPanHints(target)
    }
  },
  true,
)

window.addEventListener('resize', scheduleSync)

const mutationObserver = new MutationObserver(scheduleSync)
mutationObserver.observe(document.documentElement, { childList: true, subtree: true })

if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(scheduleSync)
  resizeObserver.observe(document.documentElement)
}

scheduleSync()
