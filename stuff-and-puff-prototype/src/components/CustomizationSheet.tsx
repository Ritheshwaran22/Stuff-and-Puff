import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus } from 'lucide-react';
import type { SauceOption } from '../types';
import { SAUCE_OPTIONS } from '../data/menuData';
import { useCart } from '../context/CartContext';

export const CustomizationSheet: React.FC = () => {
  const { customizingItem, setCustomizingItem, addItem } = useCart();
  const [selectedSauce, setSelectedSauce] = useState<SauceOption | undefined>(SAUCE_OPTIONS[0]);
  const [quantity, setQuantity] = useState(1);

  if (!customizingItem) return null;

  const basePrice = customizingItem.price;
  const saucePrice = selectedSauce ? selectedSauce.price : 0;
  const unitPrice = basePrice + saucePrice;
  const calculatedTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(customizingItem, quantity, selectedSauce);
    setCustomizingItem(null);
    setQuantity(1);
  };

  const handleClose = () => {
    setCustomizingItem(null);
    setQuantity(1);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)'
          }}
        />

        {/* Bottom Sheet / Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          style={{
            position: 'relative',
            zIndex: 101,
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            backgroundColor: 'var(--color-surface-1)',
            borderTopLeftRadius: 'var(--radius-xl)',
            borderTopRightRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            borderBottom: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          className="customization-sheet-container"
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-surface-2)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={customizingItem.isVeg ? 'veg-badge' : 'nonveg-badge'} />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-cream)'
                  }}
                >
                  {customizingItem.name}
                </h3>
              </div>
              <div
                style={{
                  color: 'var(--color-orange)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginTop: '2px'
                }}
              >
                Base: ₹{basePrice}
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Close customization sheet"
              style={{
                background: 'var(--color-surface-3)',
                border: 'none',
                color: 'var(--color-cream)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}
              >
                <h4
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--color-cream)'
                  }}
                >
                  Choose Pan-Fry Sauce
                </h4>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-orange)',
                    fontWeight: 600
                  }}
                >
                  +₹50 each
                </span>
              </div>
              <p style={{ color: 'var(--color-cream-dim)', fontSize: '0.82rem' }}>
                Select how you'd like your momos tossed on the live wok.
              </p>
            </div>

            {/* 5 Authentic Sauce Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SAUCE_OPTIONS.map(sauce => {
                const isSelected = selectedSauce?.id === sauce.id;
                return (
                  <div
                    key={sauce.id}
                    onClick={() => setSelectedSauce(sauce)}
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'rgba(223, 74, 24, 0.08)' : 'var(--color-surface-2)',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-cream-dim)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && (
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-orange)'
                              }}
                            />
                          )}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--color-cream)' }}>
                          {sauce.name}
                        </span>
                      </div>
                      <span className="font-mono" style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
                        +₹{sauce.price}
                      </span>
                    </div>

                    <div style={{ paddingLeft: '26px' }}>
                      <p style={{ color: 'var(--color-cream-dim)', fontSize: '0.82rem', lineHeight: 1.35 }}>
                        {sauce.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-cream-dim)' }}>Spice:</span>
                        <span>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span
                              key={i}
                              style={{
                                color: i < sauce.spiceLevel ? 'var(--color-orange)' : 'rgba(255,255,255,0.15)',
                                fontSize: '0.72rem'
                              }}
                            >
                              🔥
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Classic Steamed (No Sauce) Option */}
              <div
                onClick={() => setSelectedSauce(undefined)}
                style={{
                  border: `1.5px solid ${selectedSauce === undefined ? 'var(--color-orange)' : 'var(--color-border)'}`,
                  backgroundColor: selectedSauce === undefined ? 'rgba(223, 74, 24, 0.08)' : 'var(--color-surface-2)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedSauce === undefined ? 'var(--color-orange)' : 'var(--color-cream-dim)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {selectedSauce === undefined && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-orange)'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--color-cream)' }}>
                      Classic Steamed (No Sauce)
                    </span>
                  </div>
                  <span className="font-mono" style={{ color: 'var(--color-cream-dim)', fontWeight: 600 }}>
                    +₹0
                  </span>
                </div>
                <div style={{ paddingLeft: '26px', marginTop: '2px' }}>
                  <p style={{ color: 'var(--color-cream-dim)', fontSize: '0.82rem' }}>
                    Traditional tender steamed momos served with spicy red chutney dip.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls: Quantity Stepper & Add To Cart Button */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px'
              }}
            >
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-cream)',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Minus size={16} />
              </button>
              <span
                className="font-mono"
                style={{
                  minWidth: '32px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--color-cream)'
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                aria-label="Increase quantity"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-cream)',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleAddToCart}
              className="btn-primary"
              style={{ flex: 1, padding: '14px 20px', fontSize: '0.95rem' }}
            >
              <span>Add to Cart</span>
              <span>•</span>
              <span className="font-mono">₹{calculatedTotal}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
