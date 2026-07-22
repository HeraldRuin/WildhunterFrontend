export function useSliderScrollState(
  trackRef: Ref<HTMLElement | null>,
  items?: Ref<unknown[] | undefined>,
) {
  const canScrollPrev = ref(false)
  const canScrollNext = ref(false)

  function updateScrollState() {
    const track = trackRef.value

    if (!track) {
      canScrollPrev.value = false
      canScrollNext.value = false
      return
    }

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    const threshold = 1

    canScrollPrev.value = track.scrollLeft > threshold
    canScrollNext.value = track.scrollLeft < maxScrollLeft - threshold
  }

  let resizeObserver: ResizeObserver | undefined

  function bindTrack(track: HTMLElement) {
    track.addEventListener('scroll', updateScrollState, { passive: true })
    resizeObserver?.observe(track)
    updateScrollState()
  }

  function unbindTrack(track: HTMLElement) {
    track.removeEventListener('scroll', updateScrollState)
    resizeObserver?.unobserve(track)
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(updateScrollState)
    window.addEventListener('resize', updateScrollState)

    watch(trackRef, (track, previousTrack) => {
      if (previousTrack) {
        unbindTrack(previousTrack)
      }

      if (track) {
        nextTick(() => bindTrack(track))
      } else {
        updateScrollState()
      }
    }, { immediate: true })

    if (items) {
      watch(items, () => nextTick(updateScrollState))
    }
  })

  onUnmounted(() => {
    const track = trackRef.value

    if (track) {
      unbindTrack(track)
    }

    resizeObserver?.disconnect()
    window.removeEventListener('resize', updateScrollState)
  })

  return {
    canScrollPrev,
    canScrollNext,
    updateScrollState,
  }
}
