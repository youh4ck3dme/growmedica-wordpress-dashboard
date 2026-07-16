import { test, expect } from "@playwright/test"

const BASE = process.env.E2E_BASE_URL || "https://www.growmedica.cz"
const HANDLE = process.env.E2E_PRODUCT_HANDLE || "mycomedica-bio-polyporus-100-g"

test.describe("E2E nakup 1 produkt (Woo live)", () => {
  test.setTimeout(120_000)

  test("homepage -> produkt -> add to cart -> kosik", async ({ page }) => {
    const steps: string[] = []
    const log = (s: string) => {
      steps.push(s)
      console.log("STEP:", s)
    }

    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" })
    log("home")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 25000 })

    await page.goto(BASE + "/produkty/" + HANDLE, { waitUntil: "domcontentloaded" })
    log("pdp:" + HANDLE)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 25000 })

    const addBtn = page.locator("#add-to-cart-btn")
    await expect(addBtn).toBeVisible({ timeout: 15000 })
    if (await addBtn.isDisabled()) {
      log("STOP: add-to-cart disabled")
      console.log("REACHED:", steps.join(" -> "))
      return
    }

    await addBtn.click()
    await page.waitForTimeout(2500)
    log("add-to-cart-clicked")

    await page.goto(BASE + "/kosik", { waitUntil: "domcontentloaded" })
    log("kosik")
    const text = (await page.locator("body").innerText()).toLowerCase()
    if (text.includes("polyporus") || text.includes("16,20") || text.includes("16.20")) {
      log("cart-has-product")
    } else if (text.includes("prázdn") || text.includes("prazdn") || text.includes("empty") || text.includes("ziadne")) {
      log("cart-empty")
    } else {
      log("cart-unknown-content")
    }

    const checkoutLink = page.locator("a[href*=\"checkout\"], a[href*=\"poklad\"], a[href*=\"objedn\"]").first()
    if ((await page.locator("a[href*=\"checkout\"], a[href*=\"poklad\"], a[href*=\"objedn\"]").count()) > 0) {
      const href = await checkoutLink.getAttribute("href")
      log("checkout-link:" + href)
      if (href) {
        const res = await page.goto(href.startsWith("http") ? href : BASE + href, {
          waitUntil: "domcontentloaded",
        })
        log("checkout-status:" + (res?.status() ?? "?") + " url:" + page.url())
        log("checkout-title:" + (await page.title()))
      }
    } else {
      log("no-checkout-link-on-cart")
    }

    // direct CMS kosik add-to-cart
    const cms = await page.goto(
      "https://cms.growmedica.cz/kosik/?add-to-cart=1054&quantity=1",
      { waitUntil: "domcontentloaded" },
    )
    log("cms-kosik-status:" + (cms?.status() ?? "?") + " title:" + (await page.title()))

    console.log("REACHED_FINAL:", steps.join(" -> "))
  })
})
