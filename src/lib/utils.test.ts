import { cn } from "./utils"

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("px-2 py-1", "text-white")).toBe("px-2 py-1 text-white")
  })

  it("resolves tailwind class conflicts, last one wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("drops falsy values", () => {
    expect(cn("px-2", false && "py-1", undefined, null)).toBe("px-2")
  })

  it("accepts conditional objects", () => {
    expect(cn("base", { hidden: false, block: true })).toBe("base block")
  })
})
