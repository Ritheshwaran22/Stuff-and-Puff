import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sliders, Check } from 'lucide-react';
import type { CategorySlug, MenuItem } from '../types';
import { MENU_ITEMS } from '../data/menuData';
import { useCart } from '../context/CartContext';

interface MenuSectionProps {
  selectedCategory: CategorySlug;
  onCategoryChange: (category: CategorySlug) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const { addItem, setCustomizingItem } = useCart();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const categories: { slug: CategorySlug; label: string; count: number }[] = [
    { slug: 'momos', label: 'Momos (5)', count: 5 },
    { slug: 'waffles', label: 'Waffles (8)', count: 8 },
    { slug: 'buns', label: 'Sweet Buns (4)', count: 4 }
  ];

  const filteredItems = MENU_ITEMS.filter(item => item.category === selectedCategory);

  const handleItemClick = (item: MenuItem) => {
    if (item.requiresCustomization) {
      setCustomizingItem(item);
    } else {
      addItem(item, 1);
      setJustAddedId(item.id);
      setTimeout(() => setJustAddedId(null), 1000);
    }
  };

  return (
    <section
      id="menu"
      style={{
        padding: 'clamp(48px, 8vw, 84px) 0',
        backgroundColor: '#0D0D0F',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 32px)'
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: '32px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--color-orange)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              display: 'block',
              marginBottom: '6px'
            }}
          >
            ORDER FOR PICKUP
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--color-cream)',
              marginBottom: '8px'
            }}
          >
            THE STREET MENU
          </h2>
          <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.92rem' }}>
            Prices as per our pushcart menu. Parcel packaging ₹5 per item. Select momos to customize with our 5 signature sauces.
          </p>
        </div>

        {/* Thumb-Friendly Sticky Category Switcher */}
        <div className="category-tabs-sticky-wrapper">
          <div className="category-tabs-container">
            {categories.map(cat => {
              const isActive = cat.slug === selectedCategory;
              return (
                <button
                  key={cat.slug}
                  onClick={() => onCategoryChange(cat.slug)}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="active-pill-bg"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="tab-label">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practical Menu List Layout */}
        <div className="menu-items-list">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="items-grid"
            >
              {filteredItems.map(item => {
                const wasJustAdded = justAddedId === item.id;

                return (
                  <div key={item.id} className="menu-product-row">
                    {/* Item Information */}
                    <div className="product-info-col">
                      <div className="product-title-row">
                        <span className={item.isVeg ? 'veg-badge' : 'nonveg-badge'} title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'} />
                        <h3 className="product-name">{item.name}</h3>
                      </div>

                      <div className="product-price font-mono">₹{item.price}</div>

                      <p className="product-desc">{item.description}</p>

                      {item.category === 'momos' && (
                        <div className="customization-tag">
                          <Sliders size={12} color="var(--color-orange)" />
                          <span>5 Pan-Fry Sauce Choices Available (+₹50)</span>
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="product-action-col">
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`add-item-btn ${item.requiresCustomization ? 'btn-customize' : ''} ${wasJustAdded ? 'just-added' : ''}`}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        {wasJustAdded ? (
                          <>
                            <Check size={16} />
                            <span>Added</span>
                          </>
                        ) : item.requiresCustomization ? (
                          <>
                            <Sliders size={15} />
                            <span>Customize</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .category-tabs-sticky-wrapper {
          position: sticky;
          top: var(--header-height);
          z-index: 40;
          background: rgba(13, 13, 15, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 0 16px 0;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .category-tabs-container {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .category-tabs-container::-webkit-scrollbar {
          display: none;
        }

        .category-tab-btn {
          position: relative;
          background: transparent;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-full);
          cursor: pointer;
          color: var(--color-cream-dim);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.92rem;
          white-space: nowrap;
          transition: color 0.15s ease;
          user-select: none;
        }

        .category-tab-btn:hover {
          color: var(--color-cream);
        }

        .category-tab-btn.active {
          color: #FFFFFF;
        }

        .active-pill-bg {
          position: absolute;
          inset: 0;
          background: var(--color-orange);
          border-radius: var(--radius-full);
          z-index: 1;
        }

        .tab-label {
          position: relative;
          z-index: 2;
        }

        /* Product Rows Layout */
        .items-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .menu-product-row {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          transition: border-color 0.15s ease;
        }

        .menu-product-row:hover {
          border-color: rgba(255,255,255,0.15);
        }

        .product-info-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .product-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .product-name {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-cream);
        }

        .product-price {
          color: var(--color-orange);
          font-weight: 700;
          font-size: 1.05rem;
        }

        .product-desc {
          color: var(--color-cream-dim);
          font-size: 0.88rem;
          line-height: 1.4;
          max-width: 620px;
        }

        .customization-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: var(--color-cream-muted);
          margin-top: 4px;
        }

        .product-action-col {
          flex-shrink: 0;
        }

        .add-item-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--color-surface-3);
          color: var(--color-cream);
          border: 1px solid var(--color-border);
          padding: 10px 18px;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          min-width: 96px;
          transition: all 0.15s ease;
        }

        .add-item-btn:hover {
          background: var(--color-orange);
          border-color: var(--color-orange);
          color: #FFFFFF;
        }

        .add-item-btn.btn-customize {
          background: var(--color-orange-subtle);
          border-color: var(--color-orange-border);
          color: var(--color-orange);
        }

        .add-item-btn.btn-customize:hover {
          background: var(--color-orange);
          color: #FFFFFF;
        }

        .add-item-btn.just-added {
          background: var(--color-success);
          border-color: var(--color-success);
          color: #FFFFFF;
        }

        @media (max-width: 520px) {
          .menu-product-row {
            padding: 14px 16px;
            gap: 12px;
          }
          .product-name {
            font-size: 1.02rem;
          }
          .product-desc {
            font-size: 0.82rem;
          }
          .add-item-btn {
            padding: 8px 14px;
            min-width: 80px;
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
};
