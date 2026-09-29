import { describe, expect, it } from "vitest"
import { heroContent } from "./mock-hero"
import {
  contentRows,
  continueWatchingRow,
  trendingRow,
  actionRow,
  dramaRow,
  comedyRow,
  sciFiRow,
} from "./mock-rows"
import { searchResults } from "./mock-search"
import { ratingFilterOptions } from "./mock-ratings"
import type { ContentItem, ContentRow, RatingOption } from "./types"

const REQUIRED_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-G", "TV-PG", "TV-14", "TV-MA"]

function expectValidContentItem(item: ContentItem) {
  expect(item.id).toBeTruthy()
  expect(item.title).toBeTruthy()
  expect(item.description).toBeTruthy()
  expect(item.thumbnailUrl).toMatch(/^\/posters\//)
  expect(item.backdropUrl).toMatch(/^\/posters\//)
  expect(item.year).toBeGreaterThan(1900)
  expect(item.rating).toBeTruthy()
  expect(item.genres.length).toBeGreaterThan(0)
  expect(item.durationMinutes).toBeGreaterThan(0)
}

describe("mock-hero", () => {
  it("exports a featured hero item", () => {
    expect(heroContent).toHaveLength(1)
    expectValidContentItem(heroContent[0])
    expect(heroContent[0].logline).toBeTruthy()
  })
})

describe("mock-rows", () => {
  it("exports rows for all required categories in order", () => {
    expect(contentRows.map((r) => r.title)).toEqual([
      "Continue Watching",
      "Trending Now",
      "Action",
      "Drama",
      "Comedy",
      "Sci-Fi",
    ])
  })

  it("each row has at least 5 valid items", () => {
    for (const row of contentRows) {
      expect(row.items.length).toBeGreaterThanOrEqual(5)
      for (const item of row.items) {
        expectValidContentItem(item)
      }
    }
  })

  it("continue watching items carry watch progress", () => {
    for (const item of continueWatchingRow.items) {
      expect(item.progressPercent).toBeGreaterThanOrEqual(0)
      expect(item.progressPercent).toBeLessThanOrEqual(100)
    }
  })

  it("row items match their category genre (except Continue Watching)", () => {
    const expectations: Array<[ContentRow, string]> = [
      [actionRow, "Action"],
      [dramaRow, "Drama"],
      [comedyRow, "Comedy"],
      [sciFiRow, "Sci-Fi"],
    ]
    for (const [row, genre] of expectations) {
      for (const item of row.items) {
        expect(item.genres).toContain(genre)
      }
    }
    expect(trendingRow.items.length).toBeGreaterThan(0)
  })
})

describe("mock-search", () => {
  it("exports a pool of valid search results", () => {
    expect(searchResults.length).toBeGreaterThanOrEqual(10)
    for (const item of searchResults) expectValidContentItem(item)
  })
})

describe("mock-ratings", () => {
  it("exports standard rating options with labels", () => {
    expect(ratingFilterOptions.map((r) => r.value)).toEqual(REQUIRED_RATINGS)
    for (const option of ratingFilterOptions as RatingOption[]) {
      expect(option.label).toBeTruthy()
      expect(option.description).toBeTruthy()
    }
  })
})
