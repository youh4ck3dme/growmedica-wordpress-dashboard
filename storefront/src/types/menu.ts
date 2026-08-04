export interface TopBarPromotion {
  id: string
  text: string
  link: string
}

export interface TopBarData {
  promotions: TopBarPromotion[]
  shippingInfo: string
  localization: string
}

export interface MenuItem {
  name: string
  link: string
}

export interface MegaMenuColumn {
  title: string
  items: MenuItem[]
  // Set only when every item in the column shares the same parent category URL.
  href?: string
}

export interface MenuCategory {
  id: string
  name: string
  slug: string
  hasMegaMenu: boolean
  columns?: MegaMenuColumn[]
}

export interface SecondaryLink {
  id: string
  name: string
  slug: string
  isDividerBefore?: boolean
  isHighlighted?: boolean
}

// Visual grouping tab above the category row (e.g. "Zdravie & Výživa"); does not change routing.
export interface MenuDepartment {
  id: string
  name: string
  categoryIds: string[]
}

export interface MenuData {
  topBar: TopBarData
  categories: MenuCategory[]
  secondaryLinks?: SecondaryLink[]
  departments?: MenuDepartment[]
}
