export const mockHero = {
  id: '1',
  title: 'Mock Hero Title',
  backgroundImage: '/placeholder.jpg',
  // ... other hero fields
};

export const mockContentRows = [
  {
    type: 'continue_watching' as const,
    title: 'Continue Watching',
    items: [/* mock items */],
  },
  {
    type: 'trending' as const,
    title: 'Trending',
    items: [/* mock items */],
  },
  // ... other rows
];