import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(__dirname, "../..")
const css = readFileSync(resolve(root, "src/index.css"), "utf8")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let config: any
beforeAll(async () => {
  config = (await import(resolve(root, "tailwind.config.js"))).default
})

// Convert hex to the `H S% L%` triplet format used by shadcn CSS variables.
function hexToHslTriplet(hex: string): string {
  const m = hex.replace("#", "")
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 1000) / 10
  const lPct = Math.round(l * 1000) / 10
  return `${hDeg} ${sPct}% ${lPct}%`
}

/** Extract the `.dark { ... }` block from the CSS. */
function darkBlock(source: string): string {
  const match = source.match(/\.dark\s*\{([\s\S]*?)\n  \}/)
  expect(match, "index.css must define a .dark block").toBeTruthy()
  return match![1]
}

function varValue(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`))
  expect(match, `--${name} must be defined`).toBeTruthy()
  return match![1].trim()
}

describe("dark theme colors", () => {
  it("sets background to #141414", () => {
    expect(varValue(darkBlock(css), "background")).toBe(hexToHslTriplet("#141414"))
  })

  it("sets sidebar to #0d0d0d", () => {
    expect(varValue(darkBlock(css), "sidebar")).toBe(hexToHslTriplet("#0d0d0d"))
  })

  it("defines an amber brand accent (#e8a940) from the logo", () => {
    expect(varValue(darkBlock(css), "brand")).toBe(hexToHslTriplet("#e8a940"))
  })

  it("maps sidebar and brand colors into the Tailwind config", () => {
    expect(config.theme.extend.colors.sidebar).toBe("hsl(var(--sidebar))")
    expect(config.theme.extend.colors.brand.DEFAULT).toBe("hsl(var(--brand))")
  })

  it("defines text tiers matching the references (#fff / #ccc / #999)", () => {
    const block = darkBlock(css)
    expect(varValue(block, "foreground")).toBe(hexToHslTriplet("#ffffff"))
    expect(varValue(block, "muted-foreground")).toBe(hexToHslTriplet("#999999"))
    expect(varValue(block, "secondary-foreground")).toBe(hexToHslTriplet("#cccccc"))
  })
})

describe("typography scale (from reference HTML)", () => {
  it("matches the reference font sizes", () => {
    const fontSize = config.theme.extend.fontSize
    expect(fontSize["hero-title"]).toContain("64px")
    expect(fontSize["section-title"]).toContain("28px")
    expect(fontSize["heading"]).toContain("24px")
    expect(fontSize["button"]).toContain("20px")
    expect(fontSize["meta"]).toContain("18px")
  })

  it("uses medium (500) weight for hero titles and regular (400) for section titles", () => {
    expect(config.theme.extend.fontWeight.medium).toBe("500")
    expect(config.theme.extend.fontWeight.normal).toBe("400")
  })
})

describe("custom utilities", () => {
  it("provides gradient background utilities", () => {
    expect(config.theme.extend.backgroundImage["gradient-card"]).toBe(
      "linear-gradient(to bottom, var(--gradient-card-from), var(--gradient-card-to))"
    )
    expect(config.theme.extend.backgroundImage["gradient-hero"]).toBe(
      "linear-gradient(to bottom, var(--gradient-hero-from), var(--gradient-hero-to))"
    )
  })

  it("styles the scrollbar via a scrollbar utility", () => {
    expect(css).toMatch(/\.scrollbar-dark\b/)
    expect(css).toMatch(/scrollbar-color:/)
  })
})

describe("css variables sanity", () => {
  it("applies the dark theme by default on html", () => {
    expect(css).toMatch(/html\s*\{[^}]*@apply\s+dark/)
  })

  it("keeps :root and .dark in sync for the dark-only design", () => {
    // Both blocks must define the same variables (shadcn components read from :root).
    const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n  \}/)![1]
    const toNames = (block: string) =>
      (block.match(/--[a-z-]+:/g) ?? []).filter(
        (v) => !v.startsWith("--gradient-") && !v.startsWith("--radius")
      )
    expect(new Set(toNames(rootBlock))).toEqual(new Set(toNames(darkBlock(css))))
  })
})
