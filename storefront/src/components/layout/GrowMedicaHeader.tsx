'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { menuData } from '@/data/menuData'
import { useCommerceHeaderCounts } from '@/hooks/useCommerceHeaderCounts'
import { IconBasket, IconHeart, IconUser } from '@/components/icons/storefront'
import Logo from '@/components/ui/Logo'
import { MenuCategory, MegaMenuColumn } from '@/types/menu'

export default function GrowMedicaHeader() {
  const router = useRouter()
  const { cartCount, wishlistCount } = useCommerceHeaderCounts()
  const [activeMegaCategory, setActiveMegaCategory] = useState<MenuCategory | null>(null)
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<string, boolean>>({})
  const [scrolled, setScrolled] = useState(false)
  const megaMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/vyhladavanie?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const toggleMobileCategory = (id: string) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm transition-all duration-200">
      
      {/* 1. HORNÝ OZNAMOVACÍ BANER (Top Bar) */}
      <div className="bg-[#f5f6f7] border-b border-[#e8ecef] text-xs text-[#333333] py-1.5 hidden md:block">
        <div className="max-w-330 mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* Promócie / Pills vľavo */}
          <div className="flex items-center gap-2 flex-wrap">
            {menuData.topBar.promotions.map((promo) => (
              <a
                key={promo.id}
                href={promo.link}
                className="inline-flex items-center gap-1.5 bg-white border border-[#d1d5db] rounded-full px-2.5 py-0.5 text-[11.5px] font-medium text-[#222222] hover:border-[#457a27] hover:text-[#457a27] transition-all"
              >
                <svg className="w-3.5 h-3.5 text-[#d93025]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{promo.text}</span>
                <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>

          {/* Doprava a lokalizácia vpravo */}
          <div className="flex items-center gap-5 text-[12px] font-medium text-[#4b5563]">
            <div className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>{menuData.topBar.shippingInfo}</span>
            </div>

            <span className="inline-flex items-center gap-1.5 cursor-pointer hover:text-black transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{menuData.topBar.localization}</span>
            </span>
          </div>

        </div>
      </div>

      {/* 2. HLAVNÁ HLAVIČKA (Main Header Bar) */}
      <div className="bg-[#366620] text-white py-2.5">
        <div className="max-w-330 mx-auto px-4 flex items-center justify-between gap-3 md:gap-6">
          
          {/* Mobilné hamburger tlačidlo */}
          <button
            type="button"
            className="md:hidden p-1.5 text-white hover:bg-white/10 rounded-md"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Otvoriť menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-0.5">
              GrowMedica
              <svg className="w-3.5 h-4.5 text-[#8cc63f] fill-current inline-block ml-0.5" viewBox="0 0 24 24">
                <path d="M17.5 2C15 2 10 5 10 12c0 3.5 1.5 6.5 4 8.5C11 21 4 18 4 10c0-4 2.5-7.5 6-9 0 0-4 1-6 5s-2 9 1 12 8 4 12 2c3.5-1.7 5.5-5 5.5-9 0-6-4-9-9-9z"/>
              </svg>
            </span>
          </Link>

          {/* Vyhľadávací panel */}
          <div className="flex-1 max-w-170">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vyhľadať na celej stránke GrowMedica"
                className="w-full h-10 md:h-11 pl-4 pr-12 bg-white text-gray-900 rounded-full text-sm placeholder-gray-500 outline-none border-2 border-transparent focus:border-[#8cc63f] focus:ring-2 focus:ring-[#8cc63f]/30 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Vyhľadať"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
          </div>

          {/* Užívateľské akcie & Košík */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {/* Profil */}
            <Link
              href="/profil"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-white/10 rounded-md transition-colors whitespace-nowrap"
            >
              <IconUser size={22} />
              <span>Prihlásiť sa</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>

            {/* Oblúbené */}
            <Link
              href="/oblubene"
              className="relative p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Obľúbené"
            >
              <IconHeart size={24} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Košík */}
            <Link
              href="/kosik"
              className="relative p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Košík"
            >
              <div className="relative inline-flex">
                <IconBasket size={25} />
                <span className="absolute -top-1.5 -right-2 flex h-4.5 w-4.5 min-w-4.5 items-center justify-center rounded-full text-[11px] font-extrabold text-[#366620] bg-white border border-[#366620] shadow-sm">
                  {cartCount}
                </span>
              </div>
            </Link>
          </div>

        </div>
      </div>

      {/* 3. KATEGÓRIOVÉ MENU (Navigation Menu Bar) */}
      <nav data-testid="category-nav" className="relative bg-white border-b border-[#e5e5e5] hidden md:block">
        <div className="max-w-330 mx-auto px-4">
          {menuData.departments && menuData.departments.length > 0 && (
            <div data-testid="department-tabs" className="flex items-center gap-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
              {menuData.departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  data-testid={`department-tab-${dept.id}`}
                  onClick={() => setActiveDepartmentId((current) => (current === dept.id ? null : dept.id))}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    activeDepartmentId === dept.id
                      ? 'border-[#366620] text-[#366620]'
                      : 'border-transparent hover:text-[#366620]'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          )}
          <ul className="flex items-center gap-4 lg:gap-6 py-2.5 text-[13px] font-medium text-[#222222] overflow-x-auto no-scrollbar">
            
            {/* Hlavné Kategórie s Mega Menu */}
            {menuData.categories.map((cat) => {
              const activeDepartment = menuData.departments?.find((d) => d.id === activeDepartmentId)
              const isInActiveDepartment = !activeDepartment || activeDepartment.categoryIds.includes(cat.id)
              return (
              <li
                key={cat.id}
                className={`relative whitespace-nowrap group transition-opacity ${isInActiveDepartment ? '' : 'opacity-40'}`}
                onMouseEnter={() => cat.hasMegaMenu && setActiveMegaCategory(cat)}
                onMouseLeave={() => setActiveMegaCategory(null)}
              >
                <a
                  href={cat.slug}
                  className="flex items-center gap-1 py-1 hover:text-[#366620] transition-colors"
                >
                  <span>{cat.name}</span>
                  {cat.hasMegaMenu && (
                    <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#366620] transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </a>

                {/* Mega Menu Dropdown */}
                {cat.hasMegaMenu && cat.columns && activeMegaCategory?.id === cat.id && (
                  <div
                    ref={megaMenuRef}
                    className="absolute left-0 top-full mt-0 w-180 max-w-[90vw] bg-white border border-gray-200 shadow-xl rounded-b-lg p-6 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {cat.columns.map((col, idx) => (
                        <div key={idx} className="space-y-3">
                          {col.href ? (
                            <a
                              href={col.href}
                              className="block font-bold text-xs uppercase tracking-wider text-[#366620] border-b border-gray-100 pb-1.5 hover:underline"
                            >
                              {col.title}
                            </a>
                          ) : (
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#366620] border-b border-gray-100 pb-1.5">
                              {col.title}
                            </h4>
                          )}
                          <ul className="space-y-1.5">
                            {col.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <a
                                  href={item.link}
                                  className="text-xs text-gray-700 hover:text-[#366620] hover:underline transition-colors block py-0.5"
                                >
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
              )
            })}

            {/* Separátor | */}
            <li className="h-4 w-px bg-gray-300 mx-1 shrink-0" aria-hidden="true" />

            {/* Sekundárne Odkazy */}
            {menuData.secondaryLinks?.map((sec) => (
              <li key={sec.id} className="whitespace-nowrap">
                <a
                  href={sec.slug}
                  className={`py-1 transition-colors ${
                    sec.isHighlighted
                      ? 'text-[#d93025] font-bold hover:text-red-700'
                      : 'hover:text-[#366620]'
                  }`}
                >
                  {sec.name}
                </a>
              </li>
            ))}

          </ul>
        </div>
      </nav>

      {/* 4. MOBILNÉ DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-75 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="bg-[#366620] text-white p-4 flex items-center justify-between">
              <span className="font-bold text-lg">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-white hover:bg-white/10 rounded-md"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="p-4 space-y-4 flex-1">
              <div className="space-y-1 border-b border-gray-100 pb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategórie</p>
                {menuData.categories.map((cat) => (
                  <div key={cat.id} className="border-b border-gray-50 last:border-none">
                    <div className="flex items-center justify-between py-2.5">
                      <a
                        href={cat.slug}
                        className="text-sm font-semibold text-gray-800 hover:text-[#366620]"
                      >
                        {cat.name}
                      </a>
                      {cat.hasMegaMenu && (
                        <button
                          type="button"
                          onClick={() => toggleMobileCategory(cat.id)}
                          className="p-1 text-gray-500 hover:text-[#366620]"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              expandedMobileCategories[cat.id] ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Subcategories Accordion */}
                    {cat.hasMegaMenu && expandedMobileCategories[cat.id] && cat.columns && (
                      <div className="pl-3 pb-2 space-y-3 bg-gray-50/50 rounded-md p-2 my-1">
                        {cat.columns.map((col, idx) => (
                          <div key={idx} className="space-y-1">
                            <span className="text-[11px] font-bold text-[#366620] uppercase block">
                              {col.title}
                            </span>
                            <div className="pl-2 space-y-1">
                              {col.items.map((item, itemIdx) => (
                                <a
                                  key={itemIdx}
                                  href={item.link}
                                  className="text-xs text-gray-600 block py-1 hover:text-black"
                                >
                                  {item.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sekundárne Odkazy */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informácie</p>
                {menuData.secondaryLinks?.map((sec) => (
                  <a
                    key={sec.id}
                    href={sec.slug}
                    className={`block py-1.5 text-sm font-medium ${
                      sec.isHighlighted ? 'text-[#d93025] font-bold' : 'text-gray-700'
                    }`}
                  >
                    {sec.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 space-y-2">
              <p>📍 {menuData.topBar.localization}</p>
              <p>🚚 {menuData.topBar.shippingInfo}</p>
            </div>
          </div>
        </div>
      )}

    </header>
  )
}
