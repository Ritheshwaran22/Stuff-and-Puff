import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PickupSlotSelector } from './PickupSlotSelector';
import type { OrderDetails, PickupSlot } from '../types';
import { SHOP_METADATA } from '../data/menuData';

interface CheckoutModalProps {
  onOrderSuccess: (order: OrderDetails) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onOrderSuccess }) => {
  const {
    items,
    itemCount,
    subtotal,
    parcelCharges,
    totalAmount,
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedSlot,
    setSelectedSlot,
    clearCart,
    setActiveOrder
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Form errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; slot?: string }>({});

  // Payment simulation state
  const [simulationState, setSimulationState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDetails | null>(null);

  if (!isCheckoutOpen) return null;

  const validate = () => {
    const errs: { name?: string; phone?: string; slot?: string } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.name = 'Please enter your full name (at least 2 characters)';
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number (starts with 6-9)';
    }

    if (!selectedSlot) {
      errs.slot = 'Please select an available 10-minute pickup slot between 5:00 PM and 10:00 PM';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSimulatePayment = () => {
    if (!validate()) return;

    setSimulationState('processing');

    // Simulate payment gateway roundtrip
    setTimeout(() => {
      const generatedOrderId = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: OrderDetails = {
        orderId: generatedOrderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        pickupSlot: selectedSlot!.timeStr,
        items: [...items],
        subtotal,
        parcelCharges,
        total: totalAmount,
        status: 'confirmed',
        placedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setConfirmedOrder(newOrder);
      setActiveOrder(newOrder);
      clearCart();
      setSimulationState('success');
    }, 1400);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setSimulationState('idle');
    setConfirmedOrder(null);
  };

  const handleGoToTracker = () => {
    if (confirmedOrder) {
      onOrderSuccess(confirmedOrder);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 24px)'
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
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)'
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          style={{
            position: 'relative',
            zIndex: 121,
            width: '100%',
            maxWidth: '620px',
            maxHeight: '92vh',
            backgroundColor: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--color-cream)'
                }}
              >
                {simulationState === 'success' ? 'Order Confirmed' : 'Pre-Book Pickup'}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}>
                {SHOP_METADATA.shortLocation} • 5:00 PM – 10:00 PM
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Close checkout modal"
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

          {/* Modal Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {simulationState === 'success' && confirmedOrder ? (
              /* SUCCESS STATE */
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '2px solid var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto'
                  }}
                >
                  <CheckCircle2 size={36} color="var(--color-success)" />
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: 'var(--color-success)',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: '10px',
                    fontWeight: 700
                  }}
                >
                  PAYMENT SIMULATION SUCCESSFUL
                </div>

                <h4
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--color-cream)',
                    marginBottom: '6px'
                  }}
                >
                  Token: {confirmedOrder.orderId}
                </h4>

                <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Show this token at our pushcart near GH Bus Stop for immediate pickup.
                </p>

                {/* Confirmed Details Card */}
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    textAlign: 'left',
                    marginBottom: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-cream-dim)', fontSize: '0.85rem' }}>Customer:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-cream)' }}>{confirmedOrder.customerName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-cream-dim)', fontSize: '0.85rem' }}>Pickup Slot:</span>
                    <span
                      className="font-mono"
                      style={{ fontWeight: 700, color: 'var(--color-orange)', backgroundColor: 'var(--color-surface-1)', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      Today at {confirmedOrder.pickupSlot}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-cream-dim)', fontSize: '0.85rem' }}>Location:</span>
                    <span style={{ color: 'var(--color-cream)', fontSize: '0.85rem' }}>Near GH Bus Stop, Chengalpattu</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-cream-dim)', fontSize: '0.85rem' }}>Amount Paid:</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                      ₹{confirmedOrder.total}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleGoToTracker}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                  >
                    <span>Track Live Order Status</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={handleClose}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            ) : (
              /* CHECKOUT FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Customer Details Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-cream)'
                    }}
                  >
                    1. Contact Details
                  </h4>

                  {/* Name field */}
                  <div>
                    <label
                      htmlFor="customer-name"
                      style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-cream-dim)', marginBottom: '6px' }}
                    >
                      Customer Name <span style={{ color: 'var(--color-orange)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={16}
                        color="var(--color-cream-dim)"
                        style={{ position: 'absolute', left: '12px', top: '13px' }}
                      />
                      <input
                        id="customer-name"
                        type="text"
                        placeholder="e.g. Karthik Raja"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--color-surface-2)',
                          border: `1px solid ${errors.name ? 'var(--color-error)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px 12px 38px',
                          color: 'var(--color-cream)',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {errors.name && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
                        {errors.name}
                      </span>
                    )}
                  </div>

                  {/* Phone field */}
                  <div>
                    <label
                      htmlFor="customer-phone"
                      style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-cream-dim)', marginBottom: '6px' }}
                    >
                      Mobile Number (for pickup SMS / token) <span style={{ color: 'var(--color-orange)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone
                        size={16}
                        color="var(--color-cream-dim)"
                        style={{ position: 'absolute', left: '12px', top: '13px' }}
                      />
                      <input
                        id="customer-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9840123456"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--color-surface-2)',
                          border: `1px solid ${errors.phone ? 'var(--color-error)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px 12px 38px',
                          color: 'var(--color-cream)',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  {/* Email field (Optional) */}
                  <div>
                    <label
                      htmlFor="customer-email"
                      style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-cream-dim)', marginBottom: '6px' }}
                    >
                      Email Address (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        color="var(--color-cream-dim)"
                        style={{ position: 'absolute', left: '12px', top: '13px' }}
                      />
                      <input
                        id="customer-email"
                        type="email"
                        placeholder="e.g. karthik@example.com"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px 12px 38px',
                          color: 'var(--color-cream)',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pickup Slot Selector */}
                <div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-cream)',
                      marginBottom: '10px'
                    }}
                  >
                    2. Pickup Schedule
                  </h4>

                  <PickupSlotSelector
                    selectedSlot={selectedSlot}
                    onSelectSlot={(slot: PickupSlot) => {
                      setSelectedSlot(slot);
                      if (errors.slot) {
                        setErrors(prev => ({ ...prev, slot: undefined }));
                      }
                    }}
                  />
                  {errors.slot && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-error)', marginTop: '-12px', marginBottom: '14px', display: 'block' }}>
                      {errors.slot}
                    </span>
                  )}
                </div>

                {/* 3. Order Summary & Simulated Payment Action */}
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-cream-muted)' }}>
                    <span>Items ({itemCount})</span>
                    <span className="font-mono">₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-cream-muted)' }}>
                    <span>Parcel Charge (₹5/item)</span>
                    <span className="font-mono">₹{parcelCharges}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: 'var(--color-cream)',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--color-border)'
                    }}
                  >
                    <span>Total Amount</span>
                    <span className="font-mono" style={{ color: 'var(--color-orange)' }}>
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>

                {/* Prototype Disclaimer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--color-cream-dim)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <ShieldCheck size={16} color="var(--color-orange)" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Prototype Simulation:</strong> No actual payment is processed. Clicking below simulates the gateway roundtrip and creates a test token.
                  </span>
                </div>

                {/* Pay Action Button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulationState === 'processing'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1rem',
                    opacity: simulationState === 'processing' ? 0.8 : 1
                  }}
                >
                  {simulationState === 'processing' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Payment Simulation...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Payment &amp; Confirm</span>
                      <span>•</span>
                      <span className="font-mono">₹{totalAmount}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
