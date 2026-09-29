export interface SearchResultItem {
  id: string;
  title: string;
  year: number;
  rating: string;
  genre: string;
  duration: string;
  thumbnail: string;
  type: "movie" | "show";
  stars?: number;
}

export const mockSearchResults = [
  {
    id: "sr-1",
    title: "The Last Horizon",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "142 min",
    thumbnail: "/posters/sr-1.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-2",
    title: "Beyond the Stars",
    year: 2024,
    rating: "TV-14",
    genre: "Sci-Fi",
    duration: "10 episodes",
    thumbnail: "/posters/sr-2.jpg",
    type: "show" as const,
  },
  {
    id: "sr-3",
    title: "Midnight Runner",
    year: 2023,
    rating: "R",
    genre: "Thriller",
    duration: "118 min",
    thumbnail: "/posters/sr-3.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-4",
    title: "Shadows of the Past",
    year: 2022,
    rating: "TV-MA",
    genre: "Drama",
    duration: "8 episodes",
    thumbnail: "/posters/sr-4.jpg",
    type: "show" as const,
  },
  {
    id: "sr-5",
    title: "Quantum Leap",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "139 min",
    thumbnail: "/posters/sr-5.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-6",
    title: "The Silent Witness",
    year: 2023,
    rating: "R",
    genre: "Mystery",
    duration: "112 min",
    thumbnail: "/posters/sr-6.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-7",
    title: "Wild Hearts",
    year: 2024,
    rating: "PG",
    genre: "Adventure",
    duration: "105 min",
    thumbnail: "/posters/sr-7.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-8",
    title: "Dark Waters",
    year: 2023,
    rating: "TV-MA",
    genre: "Thriller",
    duration: "8 episodes",
    thumbnail: "/posters/sr-8.jpg",
    type: "show" as const,
  },
  {
    id: "sr-9",
    title: "Starlight Symphony",
    year: 2024,
    rating: "PG",
    genre: "Music",
    duration: "98 min",
    thumbnail: "/posters/sr-9.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-10",
    title: "The Final Frontier",
    year: 2024,
    rating: "PG-13",
    genre: "Sci-Fi",
    duration: "156 min",
    thumbnail: "/posters/sr-10.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-11",
    title: "Midnight Express",
    year: 2023,
    rating: "R",
    genre: "Action",
    duration: "121 min",
    thumbnail: "/posters/sr-11.jpg",
    type: "movie" as const,
  },
  {
    id: "sr-12",
    title: "Gardens of Time",
    year: 2024,
    rating: "PG",
    genre: "Drama",
    duration: "110 min",
    thumbnail: "/posters/sr-12.jpg",
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