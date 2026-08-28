/** Коды ролей из API (`Modules\Role\Models\Role`) */
export const ROLE_SUPERADMIN = 'superadmin'
export const ROLE_BASE_ADMIN = 'baseadmin'
export const ROLE_HUNTER = 'hunter'

export function isBaseAdminRole(
  roleCode?: string | null,
  roleName?: string | null,
): boolean {
  const code = (roleCode || '').trim().toLowerCase()
  const name = (roleName || '').trim().toLowerCase()

  if (code === ROLE_BASE_ADMIN || code === ROLE_SUPERADMIN) {
    return true
  }

  return (
    name === 'администратор базы'
    || name === 'baseadmin'
    || name === 'base admin'
    || name === 'суперадмин'
    || name === 'superadmin'
    || code === 'администратор базы'
  )
}
