export interface SearchResultItem {
  id: string;
  title: string;
  year: number;
  rating: string;
  genre: string;
  duration: string;
  thumbnail: string;
  type: "movie" | "show";
}

export const mockSearchResults = [
  {
    id: "sr-1",
    title: "The Last Horizon",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "142 min",
    thumbnail: "https://picsum.photos/seed/sr-1/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-2",
    title: "Beyond the Stars",
    year: 2024,
    rating: "TV-14",
    genre: "Sci-Fi",
    duration: "10 episodes",
    thumbnail: "https://picsum.photos/seed/sr-2/300/450",
    type: "show" as const,
  },
  {
    id: "sr-3",
    title: "Midnight Runner",
    year: 2023,
    rating: "R",
    genre: "Thriller",
    duration: "118 min",
    thumbnail: "https://picsum.photos/seed/sr-3/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-4",
    title: "Shadows of the Past",
    year: 2022,
    rating: "TV-MA",
    genre: "Drama",
    duration: "8 episodes",
    thumbnail: "https://picsum.photos/seed/sr-4/300/450",
    type: "show" as const,
  },
  {
    id: "sr-5",
    title: "Quantum Leap",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "139 min",
    thumbnail: "https://picsum.photos/seed/sr-5/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-6",
    title: "The Silent Witness",
    year: 2023,
    rating: "R",
    genre: "Mystery",
    duration: "112 min",
    thumbnail: "https://picsum.photos/seed/sr-6/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-7",
    title: "Wild Hearts",
    year: 2024,
    rating: "PG",
    genre: "Adventure",
    duration: "105 min",
    thumbnail: "https://picsum.photos/seed/sr-7/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-8",
    title: "Dark Waters",
    year: 2023,
    rating: "TV-MA",
    genre: "Thriller",
    duration: "8 episodes",
    thumbnail: "https://picsum.photos/seed/sr-8/300/450",
    type: "show" as const,
  },
  {
    id: "sr-9",
    title: "Starlight Symphony",
    year: 2024,
    rating: "PG",
    genre: "Music",
    duration: "98 min",
    thumbnail: "https://picsum.photos/seed/sr-9/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-10",
    title: "The Final Frontier",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "156 min",
    thumbnail: "https://picsum.photos/seed/sr-10/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-11",
    title: "Midnight Express",
    year: 2023,
    rating: "R",
    genre: "Action",
    duration: "121 min",
    thumbnail: "https://picsum.photos/seed/sr-11/300/450",
    type: "movie" as const,
  },
  {
    id: "sr-12",
    title: "Gardens of Time",
    year: 2024,
    rating: "PG",
    genre: "Drama",
    duration: "110 min",
    thumbnail: "https://picsum.photos/seed/sr-12/300/450",
    type: "movie" as const,
  },
] as SearchResultItem[];

export const mockRecentSearches = [
  "The Last Horizon",
  "Sci-Fi movies",
  "Midnight",
  "Action shows",
  "2024 releases",
] as string[];