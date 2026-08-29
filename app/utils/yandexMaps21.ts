/** Minimal typing for Yandex Maps JS API 2.1 used by BasesMapYandex. */
export type YmapsCoords = [number, number]

export interface YmapsMap {
  events: {
    add: (type: string, handler: (event: YmapsEvent) => void) => void
    remove: (type: string, handler: (event: YmapsEvent) => void) => void
  }
  geoObjects: {
    add: (object: unknown) => void
    remove: (object: unknown) => void
  }
  container: {
    fitToViewport: (preserve?: boolean) => void
    getSize: () => number[]
    getElement: () => HTMLElement
  }
  converter: {
    globalToPage: (point: number[]) => number[]
  }
  options: {
    get: (key: string) => unknown
  }
  getZoom: () => number
  getCenter: () => YmapsCoords
  getBounds: () => [YmapsCoords, YmapsCoords] | null
  getSize: () => number[]
  setCenter: (center: YmapsCoords, zoom?: number, options?: Record<string, unknown>) => void
  setBounds: (bounds: [YmapsCoords, YmapsCoords], options?: Record<string, unknown>) => void
  panTo: (center: YmapsCoords | YmapsCoords[], options?: Record<string, unknown>) => Promise<void>
  destroy: () => void
}

export interface YmapsEvent {
  get: (key: string) => unknown
}

export interface YmapsGeoObject {
  geometry: {
    getCoordinates: () => YmapsCoords
  }
  getAddressLine: () => string
}

export interface YmapsGeocodeResult {
  geoObjects: {
    get: (index: number) => YmapsGeoObject | null
  }
}

export interface YmapsApi {
  ready: (callback: () => void) => void
  Map: new (
    element: HTMLElement | string,
    state: { center: YmapsCoords, zoom: number, controls?: string[] },
    options?: Record<string, unknown>,
  ) => YmapsMap
  Placemark: new (
    coords: YmapsCoords,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    events: YmapsMap['events']
    geometry: {
      getCoordinates: () => YmapsCoords
    }
  }
  Polyline: new (
    coords: YmapsCoords[],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => unknown
  geocode: (
    request: string | YmapsCoords,
    options?: Record<string, unknown>,
  ) => Promise<YmapsGeocodeResult>
  templateLayoutFactory: {
    createClass: (template: string, methods?: Record<string, unknown>) => unknown
  }
  coordSystem: {
    geo: {
      getDistance: (a: YmapsCoords, b: YmapsCoords) => number
    }
  }
}

declare global {
  interface Window {
    ymaps?: YmapsApi
  }
}

let loadPromise: Promise<YmapsApi> | null = null

export function loadYandexMaps21(apikey: string): Promise<YmapsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps can only load in the browser'))
  }

  if (window.ymaps) {
    return new Promise((resolve) => {
      window.ymaps!.ready(() => resolve(window.ymaps!))
    })
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-yandex-maps-21]')
    if (existing) {
      existing.addEventListener('load', () => {
        window.ymaps?.ready(() => resolve(window.ymaps!))
      })
      existing.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps 2.1')))
      return
    }

    if (!apikey) {
      reject(new Error('Yandex Maps API key is missing'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apikey)}&lang=ru_RU`
    script.async = true
    script.dataset.yandexMaps21 = '1'
    script.referrerPolicy = 'origin'
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps 2.1 loaded without ymaps global'))
        return
      }

      window.ymaps.ready(() => resolve(window.ymaps!))
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Yandex Maps 2.1'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
