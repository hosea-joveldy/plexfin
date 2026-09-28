import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import "@testing-library/jest-dom/vitest"
import App from "./App"

describe("App router", () => {
  it("renders the home route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText("PlexFin")).toBeInTheDocument()
  })
})
