export type CategorySlug = 'momos' | 'waffles' | 'buns';

export interface SauceOption {
  id: string;
  name: string;
  price: number;
  spiceLevel: 1 | 2 | 3;
  description: string;
  tag?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  description: string;
  isVeg: boolean;
  spiceLevel?: number;
  image?: string;
  requiresCustomization?: boolean;
}

export interface CartItem {
  cartItemId: string; // unique key combining item id and chosen customization
  item: MenuItem;
  quantity: number;
  selectedSauce?: SauceOption;
  totalItemPrice: number;
}

export interface PickupSlot {
  timeStr: string; // e.g. "05:00 PM"
  rawHour: number;
  rawMinute: number;
  isAvailable: boolean;
  isBooked: boolean;
  reason?: string;
}

export type OrderStatusStep = 'confirmed' | 'preparing' | 'ready' | 'completed';

export interface OrderDetails {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupSlot: string;
  items: CartItem[];
  subtotal: number;
  parcelCharges: number;
  total: number;
  status: OrderStatusStep;
  placedAt: string;
}
