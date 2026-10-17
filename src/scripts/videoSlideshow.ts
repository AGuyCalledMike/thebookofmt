export function initVideoSlideshows() {
  document.querySelectorAll<HTMLElement>('[data-video-slideshow]').forEach((root) => {
    if (root.dataset.initialized) return
    root.dataset.initialized = 'true'
    const videos = Array.from(root.querySelectorAll('video'))
    const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]')!
    const status = root.querySelector<HTMLElement>('[data-status]')!
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fade = reducedMotion ? 0 : Number(root.dataset.fade) * 1000
    let index = 0
    let paused = reducedMotion
    let visible = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let fadeTimer: ReturnType<typeof setTimeout> | undefined
    let generation = 0

    const updateButton = () => {
      toggle.textContent = paused ? 'Play' : 'Pause'
      toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow')
    }
    const clearTimers = () => {
      clearTimeout(timer)
      clearTimeout(fadeTimer)
      generation++
    }
    const stop = () => {
      clearTimers()
      videos.forEach((video) => video.pause())
    }
    const schedule = () => {
      clearTimeout(timer)
      if (paused || !visible || document.hidden || videos.length < 2) return
      const duration = Number(videos[index].dataset.duration)
      timer = setTimeout(() => show(index + 1), (Number.isFinite(duration) ? Math.max(0.5, Math.min(600, duration)) : 5) * 1000)
    }
    const play = () => {
      if (paused || !visible || document.hidden) return
      const current = generation
      const video = videos[index]
      video.muted = true
      video.play().then(() => {
        if (current === generation) schedule()
      }).catch(() => {
        if (current !== generation) return
        paused = true
        stop()
        updateButton()
      })
    }
    const show = (next: number) => {
      stop()
      index = (next + videos.length) % videos.length
      videos.forEach((video, i) => {
        video.classList.toggle('active', i === index)
        video.setAttribute('aria-hidden', String(i !== index))
      })
      videos[index].currentTime = 0
      status.textContent = `${index + 1} / ${videos.length}`
      // Display time starts after the fade completes and playback begins.
      fadeTimer = setTimeout(play, fade)
    }
    root.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1))
    root.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1))
    toggle.addEventListener('click', () => {
      paused = !paused
      if (paused) stop()
      else play()
      updateButton()
    })
    videos.forEach((video) => {
      video.addEventListener('waiting', () => {
        if (video === videos[index]) clearTimeout(timer)
      })
      video.addEventListener('playing', () => {
        if (video === videos[index]) schedule()
      })
      video.addEventListener('error', () => {
        if (video !== videos[index]) return
        paused = true
        stop()
        updateButton()
        status.textContent = 'Video unavailable. Try another slide.'
      })
    })
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && root.getBoundingClientRect().width > 0
      if (visible) play()
      else stop()
    }, {threshold: 0.1})
    observer.observe(root)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop()
      else play()
    })
    updateButton()
  })
}
