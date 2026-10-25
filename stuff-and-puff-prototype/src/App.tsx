import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { IntroScreen } from './components/IntroScreen';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BrandStory } from './components/BrandStory';
import { FoodWorlds } from './components/FoodWorlds';
import { MenuSection } from './components/MenuSection';
import { CustomizationSheet } from './components/CustomizationSheet';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderStatusModal } from './components/OrderStatusModal';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import type { CategorySlug, OrderDetails } from './types';
import './styles/theme.css';

const MainContent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('momos');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const { activeOrder } = useCart();

  const handleSelectCategoryFromWorld = (category: CategorySlug) => {
    setSelectedCategory(category);
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (_order: OrderDetails) => {
    setIsTrackerOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Scene 01: Quick Intro Transition */}
      <IntroScreen onComplete={() => {}} />

      {/* Global Navigation */}
      <Navbar onOpenTracker={() => setIsTrackerOpen(true)} />

      <main style={{ flex: 1 }}>
        {/* Scene 02: Cinematic Hero */}
        <Hero />

        {/* Scene 03: Brand Story */}
        <BrandStory />

        {/* Scene 04: Three Food Worlds */}
        <FoodWorlds onSelectCategory={handleSelectCategoryFromWorld} />

        {/* Scene 05: Practical Street Menu */}
        <MenuSection
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Scene 17: Roadside Takeaway Location & Hours */}
        <LocationSection />
      </main>

      {/* Footer & Image Registry */}
      <Footer />

      {/* Modals & Overlays */}
      <CustomizationSheet />
      <CartDrawer />
      <CheckoutModal onOrderSuccess={handleOrderSuccess} />
      <OrderStatusModal
        order={activeOrder}
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
};

export default App;
