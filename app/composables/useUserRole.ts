import { isBaseAdminRole } from '~/utils/roles'

export function useUserRole() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const roleCode = computed(
    () => profile.value?.role_code || user.value?.role || '',
  )

  const roleName = computed(
    () => profile.value?.role_name || user.value?.role_name || '',
  )

  const isBaseAdmin = computed(() =>
    isBaseAdminRole(roleCode.value, roleName.value),
  )

  return {
    roleCode,
    roleName,
    isBaseAdmin,
  }
}
