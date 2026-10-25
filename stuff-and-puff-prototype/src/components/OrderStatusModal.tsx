import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ChefHat, ShoppingBag, ArrowLeft, RotateCw } from 'lucide-react';
import type { OrderDetails, OrderStatusStep } from '../types';
import { SHOP_METADATA } from '../data/menuData';

interface OrderStatusModalProps {
  order: OrderDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<OrderStatusStep>('confirmed');

  if (!isOpen || !order) return null;

  const steps: { key: OrderStatusStep; title: string; subtitle: string; icon: any }[] = [
    {
      key: 'confirmed',
      title: 'Order Confirmed',
      subtitle: 'Slot locked and token generated.',
      icon: CheckCircle2
    },
    {
      key: 'preparing',
      title: 'Live Preparation',
      subtitle: 'Momos pan-tossed, waffles pressed, buns toasted.',
      icon: ChefHat
    },
    {
      key: 'ready',
      title: 'Ready for Pickup',
      subtitle: 'Piped hot at pushcart near GH Bus Stop.',
      icon: ShoppingBag
    },
    {
      key: 'completed',
      title: 'Handover Completed',
      subtitle: 'Order collected. Enjoy your street food!',
      icon: CheckCircle2
    }
  ];

  const stepOrder: OrderStatusStep[] = ['confirmed', 'preparing', 'ready', 'completed'];
  const currentIndex = stepOrder.indexOf(currentStep);

  const handleAdvanceStep = () => {
    const nextIdx = (currentIndex + 1) % stepOrder.length;
    setCurrentStep(stepOrder[nextIdx]);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 130,
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
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
            zIndex: 131,
            width: '100%',
            maxWidth: '540px',
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
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--color-orange)',
                  letterSpacing: '0.12em',
                  fontWeight: 700
                }}
              >
                LIVE TOKEN TRACKER
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--color-cream)'
                }}
              >
                Order #{order.orderId}
              </h3>
            </div>

            <button
              onClick={onClose}
              aria-label="Close status tracker"
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

          {/* Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {/* Pickup Info Banner */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}>Pickup Window</div>
                <div className="font-mono" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-cream)' }}>
                  Today at {order.pickupSlot}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}>Pickup Point</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-orange)' }}>
                  {SHOP_METADATA.shortLocation}
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
              {steps.map((st, idx) => {
                const isPassed = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const IconComponent = st.icon;

                return (
                  <div key={st.key} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    {/* Step Icon / Indicator */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent
                          ? 'var(--color-orange)'
                          : isPassed
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'var(--color-surface-3)',
                        border: `2px solid ${
                          isCurrent
                            ? 'var(--color-orange)'
                            : isPassed
                            ? 'var(--color-success)'
                            : 'var(--color-border)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCurrent ? '#FFFFFF' : isPassed ? 'var(--color-success)' : 'var(--color-cream-dim)',
                        flexShrink: 0,
                        zIndex: 2,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IconComponent size={18} />
                    </div>

                    {/* Step Details */}
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: isCurrent
                            ? 'var(--color-orange)'
                            : isPassed
                            ? 'var(--color-cream)'
                            : 'var(--color-cream-dim)'
                        }}
                      >
                        {st.title} {isCurrent && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>(Active)</span>}
                      </div>
                      <div style={{ color: 'var(--color-cream-dim)', fontSize: '0.82rem', marginTop: '2px' }}>
                        {st.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation Controller */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-cream-muted)', fontWeight: 600 }}>
                  Interactive Prototype Control
                </span>
                <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--color-cream-dim)' }}>
                  State: {currentStep.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--color-cream-dim)', marginBottom: '10px' }}>
                Simulate the real-time pushcart workflow by clicking the button below:
              </p>
              <button
                onClick={handleAdvanceStep}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.82rem', gap: '6px' }}
              >
                <RotateCw size={14} />
                <span>Next Status Step &rarr;</span>
              </button>
            </div>

            {/* Back to Menu */}
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.92rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Menu</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
