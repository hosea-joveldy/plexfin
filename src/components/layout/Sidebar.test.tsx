import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import Sidebar from "./Sidebar"
import MainContent from "./MainContent"

function renderSidebar(ui = <Sidebar />, { initialEntries = ["/"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe("Sidebar expanding rail behavior", () => {
  it("collapses to 80px by default", () => {
    renderSidebar()
    const nav = screen.getByRole("navigation", { name: "Primary" })
    expect(nav).toHaveClass("w-[80px]")
    expect(nav).not.toHaveClass("w-[240px]")
  })

  it("expands to 240px on hover and collapses on mouse leave", async () => {
    const user = userEvent.setup()
    renderSidebar()
    const nav = screen.getByRole("navigation", { name: "Primary" })
    await user.hover(nav)
    expect(nav).toHaveClass("w-[240px]")
    await user.unhover(nav)
    expect(nav).toHaveClass("w-[80px]")
  })

  it("stays collapsed while the search flyout is open", async () => {
    const user = userEvent.setup()
    renderSidebar(<Sidebar isSearchOpen />)
    const nav = screen.getByRole("navigation", { name: "Primary" })
    await user.hover(nav)
    expect(nav).toHaveClass("w-[80px]")
  })

  it("reports hover state changes so main content can shift in sync", async () => {
    const user = userEvent.setup()
    const onHoverChange = vi.fn()
    renderSidebar(<Sidebar onHoverChange={onHoverChange} />)
    const nav = screen.getByRole("navigation", { name: "Primary" })
    await user.hover(nav)
    expect(onHoverChange).toHaveBeenLastCalledWith(true)
    await user.unhover(nav)
    expect(onHoverChange).toHaveBeenLastCalledWith(false)
  })

  it("renders inline labels for Home, Search, Ratings and Settings", () => {
    renderSidebar()
    for (const label of ["Home", "Search", "Ratings", "Settings"]) {
      const labelEl = screen.getByText(label, { selector: "nav span[aria-hidden]" })
      expect(labelEl).toBeInTheDocument()
    }
  })

  it("reveals all labels when the rail is expanded, hides them when collapsed", async () => {
    const user = userEvent.setup()
    renderSidebar()
    const nav = screen.getByRole("navigation", { name: "Primary" })
    const homeLabel = screen.getByText("Home", { selector: "nav span[aria-hidden]" })
    // Collapsed: label hidden unless its own item is hovered.
    expect(homeLabel).toHaveClass("opacity-0")
    await user.hover(nav)
    // Rail expanded: label revealed.
    expect(homeLabel).toHaveClass("opacity-100")
  })

  it("keeps accessible names on links and buttons regardless of expansion", () => {
    renderSidebar()
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ratings" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument()
  })

  it("marks the active route with aria-current", () => {
    renderSidebar(<Sidebar />, { initialEntries: ["/ratings"] })
    const ratingsLink = screen.getByRole("link", { name: "Ratings" })
    expect(ratingsLink).toHaveAttribute("aria-current", "page")
    const homeLink = screen.getByRole("link", { name: "Home" })
    expect(homeLink).not.toHaveAttribute("aria-current")
  })
})

describe("MainContent shift behavior", () => {
  it("sits 80px from the left by default", () => {
    render(<MainContent>content</MainContent>)
    const main = screen.getByRole("main")
    expect(main).toHaveClass("ml-[80px]")
    expect(main).not.toHaveClass("ml-[240px]")
  })

  it("shifts to 240px when the sidebar is hover-expanded", () => {
    render(<MainContent sidebarExpanded>content</MainContent>)
    const main = screen.getByRole("main")
    expect(main).toHaveClass("ml-[240px]")
    expect(main).not.toHaveClass("ml-[80px]")
  })
})
