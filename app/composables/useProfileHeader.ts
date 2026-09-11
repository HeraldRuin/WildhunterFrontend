import type { BreadcrumbItem } from '~/types/breadcrumb'

export interface ProfileHeaderOptions {
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  divider?: boolean
  helpText?: string
}

export function useProfileHeader() {
  const breadcrumbs = useState<BreadcrumbItem[]>('profile-header-breadcrumbs', () => [])
  const title = useState<string>('profile-header-title', () => '')
  const divider = useState<boolean>('profile-header-divider', () => false)
  const helpText = useState<string | undefined>('profile-header-help-text', () => undefined)

  const isActive = computed(() => Boolean(title.value) || breadcrumbs.value.length > 0)

  function setProfileHeader(options: ProfileHeaderOptions) {
    breadcrumbs.value = options.breadcrumbs ? [...options.breadcrumbs] : []
    title.value = options.title ?? ''
    divider.value = options.divider ?? false
    helpText.value = options.helpText
  }

  function clearProfileHeader() {
    breadcrumbs.value = []
    title.value = ''
    divider.value = false
    helpText.value = undefined
  }

  return {
    breadcrumbs,
    title,
    divider,
    helpText,
    isActive,
    setProfileHeader,
    clearProfileHeader,
  }
}
