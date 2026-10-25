import React from 'react';
import { ShoppingBag, Compass } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenTracker: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTracker }) => {
  const { itemCount, setIsCartOpen, activeOrder } = useCart();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(13, 13, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 32px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        {/* Brand */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-orange-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0
            }}
          >
            🥟
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--color-cream)'
              }}
            >
              STUFF <span style={{ color: 'var(--color-orange)' }}>&amp;</span> PUFF
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--color-cream-dim)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              Chengalpattu
            </div>
          </div>
        </a>

        {/* Desktop Quick Nav */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '24px'
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => scrollToSection('menu')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cream-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
          >
            Menu
          </button>
          <button
            onClick={() => scrollToSection('three-worlds')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cream-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
          >
            Food Worlds
          </button>
          <button
            onClick={() => scrollToSection('story')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cream-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
          >
            Story
          </button>
          <button
            onClick={() => scrollToSection('location')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cream-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
          >
            Location
          </button>

          {/* Active Order Tracker Button */}
          {activeOrder && (
            <button
              onClick={onOpenTracker}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ADE80',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Compass size={13} />
              <span>Token: {activeOrder.orderId}</span>
            </button>
          )}
        </nav>

        {/* Actions / Status & Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Badge (Desktop & Tablet) */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              color: 'var(--color-cream-muted)'
            }}
            className="desktop-status"
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--color-cream)' }}>OPEN FOR PICKUP</span>
            <span style={{ color: 'var(--color-cream-dim)' }}>• 5:00 PM–10:00 PM</span>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`View Cart, ${itemCount} items`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-cream)',
              border: '1px solid var(--color-border)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={18} color="var(--color-orange)" />
            <span className="cart-btn-label">Cart</span>
            {itemCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-orange)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 840px) {
          .desktop-nav { display: flex !important; }
          .desktop-status { display: flex !important; }
        }
      `}</style>
    </header>
  );
};
