/**
 * iPhone CSS viewports for integrity / responsive tests.
 * Includes SE → Pro Max lineage + iPhone 17 family (logical CSS px).
 */
export type IphoneViewport = {
  id: string
  label: string
  width: number
  height: number
  deviceScaleFactor: number
  isMobile: true
  hasTouch: true
  userAgent: string
}

const UA_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

function iphone(
  id: string,
  label: string,
  width: number,
  height: number,
  deviceScaleFactor = 3,
): IphoneViewport {
  return {
    id,
    label,
    width,
    height,
    deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: UA_IOS,
  }
}

/** Všetky relevantné iPhone rozmery pre responsive integrity */
export const IPHONE_VIEWPORTS: IphoneViewport[] = [
  iphone('iphone-se', 'iPhone SE (3rd)', 375, 667, 2),
  iphone('iphone-13-mini', 'iPhone 13 mini', 375, 812, 3),
  iphone('iphone-14', 'iPhone 14', 390, 844, 3),
  iphone('iphone-14-plus', 'iPhone 14 Plus', 428, 926, 3),
  iphone('iphone-15', 'iPhone 15', 393, 852, 3),
  iphone('iphone-15-pro', 'iPhone 15 Pro', 393, 852, 3),
  iphone('iphone-15-pro-max', 'iPhone 15 Pro Max', 430, 932, 3),
  iphone('iphone-16', 'iPhone 16', 393, 852, 3),
  iphone('iphone-16-plus', 'iPhone 16 Plus', 430, 932, 3),
  iphone('iphone-16-pro', 'iPhone 16 Pro', 402, 874, 3),
  iphone('iphone-16-pro-max', 'iPhone 16 Pro Max', 440, 956, 3),
  // iPhone 17 family (logical CSS px — 2025 lineup)
  iphone('iphone-17', 'iPhone 17', 402, 874, 3),
  iphone('iphone-17-air', 'iPhone 17 Air', 420, 912, 3),
  iphone('iphone-17-pro', 'iPhone 17 Pro', 402, 874, 3),
  iphone('iphone-17-pro-max', 'iPhone 17 Pro Max', 440, 956, 3),
]

export const IPHONE_17_ONLY = IPHONE_VIEWPORTS.filter((v) => v.id.startsWith('iphone-17'))
