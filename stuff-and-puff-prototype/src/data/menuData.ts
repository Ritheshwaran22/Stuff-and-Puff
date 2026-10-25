import type { MenuItem, SauceOption } from '../types';

export const SHOP_METADATA = {
  name: 'STUFF & PUFF',
  tagline: 'Street Food Worth Stopping For.',
  supporting: 'Hot momos. Crispy waffles. Fresh buns.',
  location: 'Near GH Bus Stop, Chengalpattu, Tamil Nadu',
  shortLocation: 'GH Bus Stop, Chengalpattu',
  operatingHours: '5:00 PM – 10:00 PM',
  openingTimeHour: 17, // 5:00 PM
  closingTimeHour: 22, // 10:00 PM
  preparationBufferMins: 20,
  slotIntervalMins: 10,
  maxOrdersPerSlot: 2,
  parcelChargePerItem: 5.0,
  phone: '+91 98400 00000',
  googleMapsUrl: 'https://maps.google.com/?q=Chengalpattu+Government+Hospital+Bus+Stop'
};

export const SAUCE_OPTIONS: SauceOption[] = [
  {
    id: 'dragon-blaze',
    name: 'Dragon Blaze',
    price: 50,
    spiceLevel: 3,
    description: 'Sichuan wok toss with crushed bird’s eye chili, dark soya, and toasted sesame.',
    tag: 'Spicy Signature'
  },
  {
    id: 'fiery-fusion',
    name: 'Fiery Fusion',
    price: 50,
    spiceLevel: 3,
    description: 'Smoked chili paste reduction with garlic embers, vinegar bite, and spring onions.',
    tag: 'Roadside Heat'
  },
  {
    id: 'cheese-volcano',
    name: 'Cheese Volcano',
    price: 50,
    spiceLevel: 3,
    description: 'Molten cream cheese tossed vigorously with hot chili oil and cracked peppercorn.',
    tag: 'Cheesy & Fiery'
  },
  {
    id: 'honey-garlic-cheese',
    name: 'Honey Garlic Cheese Blast',
    price: 50,
    spiceLevel: 2,
    description: 'Sweet amber honey glaze meets roasted garlic bits and gooey cheese cream.',
    tag: 'Crowd Favorite'
  },
  {
    id: 'garlic-cheese-blast',
    name: 'Garlic Cheese Blast',
    price: 50,
    spiceLevel: 3,
    description: 'Intense minced burnt garlic, bubbling mozzarella emulsion, and red pepper flakes.',
    tag: 'Garlic Rich'
  }
];

export const MENU_ITEMS: MenuItem[] = [
  // MOMOS
  {
    id: 'momo-veg',
    name: 'Veg Momos',
    category: 'momos',
    price: 70,
    description: 'Finely minced garden cabbage, carrots, onion, and ground spices tucked in paper-thin steamed dough.',
    isVeg: true,
    requiresCustomization: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'momo-corn',
    name: 'Corn Momos',
    category: 'momos',
    price: 90,
    description: 'Sweet golden sweet corn kernels tempered with crushed black pepper and chopped scallions.',
    isVeg: true,
    requiresCustomization: true,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'momo-paneer',
    name: 'Paneer Momos',
    category: 'momos',
    price: 80,
    description: 'Soft crumbled dairy paneer folded with coriander leaves and mild warming whole spices.',
    isVeg: true,
    requiresCustomization: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'momo-chicken',
    name: 'Chicken Momos',
    category: 'momos',
    price: 100,
    description: 'Juicy, seasoned minced chicken with fresh ginger, cilantro, and authentic Himalayan momo masala.',
    isVeg: false,
    requiresCustomization: true,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'momo-mixed',
    name: 'Mixed Momos',
    category: 'momos',
    price: 120,
    description: 'The ultimate sampler box featuring a curated combination of paneer, corn, veg, and chicken momos.',
    isVeg: false,
    requiresCustomization: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80'
  },

  // WAFFLES
  {
    id: 'waffle-single',
    name: 'Single Waffle (Single Piece)',
    category: 'waffles',
    price: 50,
    description: 'Freshly pressed golden grid waffle with crisp caramelized crust and fluffy interior.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-white',
    name: 'White',
    category: 'waffles',
    price: 80,
    description: 'Smothered in velvety warm Belgian white chocolate ganache with a delicate vanilla aroma.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-milk',
    name: 'Milk',
    category: 'waffles',
    price: 80,
    description: 'Coated in creamy, slow-melted milk chocolate that pools generously into every waffle square.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-dark',
    name: 'Dark',
    category: 'waffles',
    price: 100,
    description: 'Intense 55% dark chocolate melted to glossy perfection, balancing bittersweet cocoa notes.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-butterscotch',
    name: 'ButterScotch',
    category: 'waffles',
    price: 100,
    description: 'Buttery brown sugar caramel drizzle topped with crunchy golden butterscotch praline crisps.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-hazelnut',
    name: 'Hazelnut',
    category: 'waffles',
    price: 100,
    description: 'Roasted hazelnut cocoa spread layered thick over piping hot freshly baked waffle grids.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-double-choco',
    name: 'Double Choco',
    category: 'waffles',
    price: 110,
    description: 'Dual layer indulgence featuring silky milk chocolate intertwined with decadent dark cocoa.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'waffle-triple-choco',
    name: 'Triple Choco',
    category: 'waffles',
    price: 120,
    description: 'The heavyweight showstopper: rich layers of white, milk, and dark chocolate cascading together.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=600&q=80'
  },

  // BUNS
  {
    id: 'bun-butter-jam',
    name: 'Bun Butter Jam',
    category: 'buns',
    price: 40,
    description: 'Classic nostalgic tea-stall favorite: soft split bun slathered with generous churned butter and mixed fruit jam.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'bun-palkova',
    name: 'Bun Palkova (Pakova Bun)',
    category: 'buns',
    price: 50,
    description: 'Pillow-soft bakery bun loaded with traditional rich, slow-simmered milk sweet (palkova) that melts on your tongue.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'bun-gulkand',
    name: 'Bun Gulkand',
    category: 'buns',
    price: 50,
    description: 'Sun-cooked Damask rose petal preserve (gulkand) layered with fragrant butter inside a warm toasted bun.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'bun-choco',
    name: 'Choco Bun',
    category: 'buns',
    price: 50,
    description: 'Toasted bun generously stuffed with silky chocolate fudge spread that oozes out with every warm bite.',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
  }
];
