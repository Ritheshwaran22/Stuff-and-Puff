import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, SauceOption, CartItem, PickupSlot, OrderDetails } from '../types';
import { SHOP_METADATA } from '../data/menuData';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, selectedSauce?: SauceOption) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  parcelCharges: number;
  totalAmount: number;
  itemCount: number;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  customizingItem: MenuItem | null;
  setCustomizingItem: (item: MenuItem | null) => void;

  selectedSlot: PickupSlot | null;
  setSelectedSlot: (slot: PickupSlot | null) => void;

  activeOrder: OrderDetails | null;
  setActiveOrder: (order: OrderDetails | null) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('stuff_puff_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PickupSlot | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('stuff_puff_cart', JSON.stringify(items));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [items]);

  const addItem = (item: MenuItem, quantity: number, selectedSauce?: SauceOption) => {
    const saucePrice = selectedSauce ? selectedSauce.price : 0;
    const unitPrice = item.price + saucePrice;
    const cartItemId = `${item.id}_${selectedSauce ? selectedSauce.id : 'plain'}`;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(ci => ci.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            cartItemId,
            item,
            quantity,
            selectedSauce,
            totalItemPrice: unitPrice
          }
        ];
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems(prevItems => {
      return prevItems
        .map(ci => {
          if (ci.cartItemId === cartItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null);
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems(prevItems => prevItems.filter(ci => ci.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const subtotal = items.reduce((sum, ci) => sum + ci.totalItemPrice * ci.quantity, 0);
  const parcelCharges = itemCount * SHOP_METADATA.parcelChargePerItem;
  const totalAmount = subtotal + parcelCharges;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        parcelCharges,
        totalAmount,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        customizingItem,
        setCustomizingItem,
        selectedSlot,
        setSelectedSlot,
        activeOrder,
        setActiveOrder,
        isCheckoutOpen,
        setIsCheckoutOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
