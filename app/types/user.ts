export interface UserWeapon {
  id: number | null
  hunter_license_number: string
  hunter_license_date: string
  weapon_type_id: string
  caliber: string
  isNew?: boolean
}

export interface WeaponOption {
  value: string
  label: string
}

export interface ProfileUser {
  id: number
  user_name: string
  email: string
  first_name: string
  last_name: string
  phone: string
  birthday: string
  bio: string
  avatar: string | null
  hunter_billet_number: string
  role_name: string
  role_code: string
  created_at: string
  weapons: UserWeapon[]
  weapon_types: WeaponOption[]
  calibers: WeaponOption[]
}
