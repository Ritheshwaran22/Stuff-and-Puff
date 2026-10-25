export interface ImageCredit {
  id: string;
  category: string;
  sourceUrl: string;
  imageUrl: string;
  photographer: string;
  license: string;
  commercialUsePermitted: boolean;
  attributionRequirement: string;
  notes: string;
}

export const IMAGE_CREDITS: ImageCredit[] = [
  {
    id: 'momos-hero',
    category: 'Momos (Hero & World)',
    sourceUrl: 'https://unsplash.com/photos/steamed-dumplings-in-bamboo-steamer-EB3h8rV4_gQ',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Rathaphon Nanthapreecha (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Authentic dumplings served hot in traditional steamer.'
  },
  {
    id: 'momos-panfry',
    category: 'Momos (Pan Fry / Sauce)',
    sourceUrl: 'https://unsplash.com/photos/cooked-dumplings-on-plate-W7OKvvbmsfM',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Mae Mu (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Pan-seared dumplings with chili oil and garlic dipping sauce.'
  },
  {
    id: 'waffles-hero',
    category: 'Waffles (Hero & World)',
    sourceUrl: 'https://unsplash.com/photos/waffles-with-berries-and-chocolate-UfETna4IUuY',
    imageUrl: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Slashio Photography (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Crispy deep-pocket waffle with chocolate glaze and dusting.'
  },
  {
    id: 'waffles-choco',
    category: 'Waffles (Chocolate & Hazelnut)',
    sourceUrl: 'https://unsplash.com/photos/waffle-with-chocolate-syrup-9-nN_1BvV3c',
    imageUrl: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Toa Heftiba (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Golden waffle drizzled with melted chocolate.'
  },
  {
    id: 'buns-hero',
    category: 'Buns (Hero & World)',
    sourceUrl: 'https://unsplash.com/photos/round-brown-bread-on-table-qwtm3nzqJpU',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Wesual Click (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Freshly baked soft bakery buns with golden brown crust.'
  },
  {
    id: 'buns-butter-jam',
    category: 'Buns (Butter & Jam)',
    sourceUrl: 'https://unsplash.com/photos/bread-with-butter-and-jam-9A8w2X678cQ',
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Calum Lewis (via Unsplash)',
    license: 'Unsplash License',
    commercialUsePermitted: true,
    attributionRequirement: 'Attribution appreciated under Unsplash terms; commercial use granted.',
    notes: 'Warm toasted bread with rich dollop of fresh butter and sweet spread.'
  }
];
