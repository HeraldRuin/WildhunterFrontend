export interface BasesSearchParams {
  location: string
  animal: string
  dates: string
  checkIn: string
  checkOut: string
  guests: string
}

const emptyParams = (): BasesSearchParams => ({
  location: '',
  animal: '',
  dates: '',
  checkIn: '',
  checkOut: '',
  guests: '',
})

export function useBasesSearchParams() {
  const params = useState<BasesSearchParams>('bases-search-params', emptyParams)

  function setParams(payload: Record<string, string>) {
    params.value = {
      location: payload.location?.trim() ?? '',
      animal: payload.animal?.trim() ?? '',
      dates: payload.dates?.trim() ?? '',
      checkIn: payload.checkIn?.trim() ?? '',
      checkOut: payload.checkOut?.trim() ?? '',
      guests: payload.guests?.trim() ?? '',
    }
  }

  return { params, setParams }
}
