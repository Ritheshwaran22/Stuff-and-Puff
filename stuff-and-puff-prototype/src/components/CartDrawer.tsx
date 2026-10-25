import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    parcelCharges,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    setIsCheckoutOpen
  } = useCart();

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      {/* =========================================================================
          STICKY BOTTOM CART BAR (Visible when items in cart & cart drawer is closed)
          ========================================================================= */}
      <AnimatePresence>
        {itemCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'fixed',
              bottom: '16px',
              left: '16px',
              right: '16px',
              zIndex: 45,
              maxWidth: '520px',
              margin: '0 auto'
            }}
          >
            <div
              onClick={() => setIsCartOpen(true)}
              style={{
                backgroundColor: 'var(--color-surface-1)',
                border: '1.5px solid var(--color-orange-border)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 16px rgba(223, 74, 24, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-orange)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}
                >
                  {itemCount}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-cream-dim)', textTransform: 'uppercase' }}>
                    Pickup Cart
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-cream)' }}>
                    ₹{totalAmount}{' '}
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-cream-dim)', fontWeight: 400 }}>
                      (incl. ₹{parcelCharges} parcel)
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-orange)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                <span>View Cart</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          CART DRAWER / SHEET
          ========================================================================= */}
      <AnimatePresence>
        {isCartOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)'
              }}
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              style={{
                position: 'relative',
                zIndex: 111,
                width: '100%',
                maxWidth: '480px',
                height: '100%',
                backgroundColor: 'var(--color-surface-1)',
                borderLeft: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--color-surface-2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingBag size={20} color="var(--color-orange)" />
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'var(--color-cream)'
                      }}
                    >
                      Your Pickup Order
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}>
                      Near GH Bus Stop, Chengalpattu
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close cart"
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

              {/* Items List / Empty State */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 16px',
                      color: 'var(--color-cream-dim)'
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🥟</div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-cream)',
                        fontSize: '1.2rem',
                        marginBottom: '6px'
                      }}
                    >
                      Your cart is empty
                    </h4>
                    <p style={{ fontSize: '0.88rem', maxWidth: '280px', margin: '0 auto 24px auto' }}>
                      Add hot momos, crispy chocolate waffles, or toasted sweet buns to start.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(cartItem => (
                      <div
                        key={cartItem.cartItemId}
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={cartItem.item.isVeg ? 'veg-badge' : 'nonveg-badge'} />
                              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-cream)' }}>
                                {cartItem.item.name}
                              </span>
                            </div>

                            {cartItem.selectedSauce ? (
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--color-orange)',
                                  marginTop: '3px',
                                  fontWeight: 600
                                }}
                              >
                                Sauce: {cartItem.selectedSauce.name} (+₹50)
                              </div>
                            ) : cartItem.item.category === 'momos' ? (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-cream-dim)', marginTop: '3px' }}>
                                Classic Steamed (No Sauce)
                              </div>
                            ) : null}
                          </div>

                          <div className="font-mono" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                            ₹{cartItem.totalItemPrice * cartItem.quantity}
                          </div>
                        </div>

                        {/* Controls Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-dim)' }}>
                            ₹{cartItem.totalItemPrice} each
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Quantity Stepper */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--color-surface-1)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <button
                                onClick={() => updateQuantity(cartItem.cartItemId, -1)}
                                aria-label="Decrease quantity"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-cream)',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Minus size={14} />
                              </button>
                              <span
                                className="font-mono"
                                style={{
                                  minWidth: '24px',
                                  textAlign: 'center',
                                  fontSize: '0.85rem',
                                  fontWeight: 700
                                }}
                              >
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(cartItem.cartItemId, 1)}
                                aria-label="Increase quantity"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-cream)',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeItem(cartItem.cartItemId)}
                              aria-label="Remove item"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-cream-dim)',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Details & Checkout CTA */}
              {items.length > 0 && (
                <div
                  style={{
                    padding: '20px',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-cream-muted)' }}>
                      <span>Item Subtotal ({itemCount} items)</span>
                      <span className="font-mono">₹{subtotal}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-cream-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={13} color="var(--color-orange)" />
                        Takeaway Parcel Charge (₹5/item)
                      </span>
                      <span className="font-mono">₹{parcelCharges}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--color-cream)',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--color-border)'
                      }}
                    >
                      <span>Total Payable</span>
                      <span className="font-mono" style={{ color: 'var(--color-orange)' }}>
                        ₹{totalAmount}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToCheckout}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
