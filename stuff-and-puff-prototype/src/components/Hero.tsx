import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Clock, MapPin, ArrowDown } from 'lucide-react';
import { SHOP_METADATA } from '../data/menuData';

export const Hero: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const handleOrderNow = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'clamp(32px, 6vw, 64px)',
        paddingBottom: 'clamp(48px, 8vw, 80px)',
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
        {/* Main Grid / Editorial Split Composition */}
        <div className="hero-editorial-grid">
          {/* Left Column: Brand, Status, Headlines, Ordering Action */}
          <div className="hero-left-content">
            {/* Badges Row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#4ADE80',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)'
                  }}
                />
                OPEN FOR PICKUP
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-cream-muted)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem'
                }}
              >
                <Clock size={12} color="var(--color-orange)" />
                <span>{SHOP_METADATA.operatingHours}</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.4rem, 6.5vw, 4.4rem)',
                fontWeight: 800,
                lineHeight: 1.02,
                color: 'var(--color-cream)',
                letterSpacing: '-0.035em',
                marginBottom: '18px',
                textTransform: 'uppercase'
              }}
            >
              STREET FOOD <br />
              <span style={{ color: 'var(--color-orange)' }}>WORTH STOPPING</span> FOR.
            </h1>

            {/* Supporting Core Message */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)',
                fontWeight: 400,
                color: 'var(--color-cream-muted)',
                marginBottom: '24px',
                lineHeight: 1.4,
                maxWidth: '520px'
              }}
            >
              Hot momos tossed in 5 fiery sauces. Crispy chocolate-drizzled waffles. Soft bakery sweet buns toasted fresh at our roadside pushcart.
            </p>

            {/* Location & Micro details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '32px',
                color: 'var(--color-cream-dim)',
                fontSize: '0.88rem'
              }}
            >
              <MapPin size={16} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--color-cream)', fontWeight: 600 }}>
                  Near GH Bus Stop, Chengalpattu
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-cream-dim)' }}>
                  10-minute pickup slot pre-booking • Zero cart waiting
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleOrderNow}
                className="btn-primary"
                id="hero-order-btn"
                style={{
                  fontSize: '1.05rem',
                  padding: '16px 36px',
                  boxShadow: '0 8px 24px rgba(223, 74, 24, 0.28)'
                }}
              >
                <span>ORDER NOW</span>
                <ArrowDown size={18} />
              </button>

              <a
                href="#three-worlds"
                className="btn-secondary"
                style={{ padding: '15px 24px', fontSize: '0.9rem' }}
              >
                Explore Worlds &darr;
              </a>
            </div>
          </div>

          {/* Right Column: Layered 3-Food Visual Story (Momos, Waffles, Buns) */}
          <div className="hero-visual-composition">
            {/* Collage Container showcasing all 3 foods intentionally */}
            <div className="food-triptych">
              {/* Card 1: Momos */}
              <motion.div
                className="food-preview-card card-momos"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"
                  alt="Hot steamed and pan-fried momos with fiery chili dip"
                  loading="eager"
                  className="preview-img"
                />
                <div className="card-scrim">
                  <span className="category-pill">01 • MOMOS</span>
                  <div className="card-title">Pan-Fry Sauces</div>
                  <div className="card-subtitle">5 Signature Tosses • From ₹70</div>
                </div>
              </motion.div>

              {/* Card 2: Waffles */}
              <motion.div
                className="food-preview-card card-waffles"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=800&q=80"
                  alt="Crispy hot pressed waffles drizzled with chocolate"
                  loading="eager"
                  className="preview-img"
                />
                <div className="card-scrim">
                  <span className="category-pill">02 • WAFFLES</span>
                  <div className="card-title">Crisp Belgian Grids</div>
                  <div className="card-subtitle">Triple Choco &amp; ButterScotch • From ₹50</div>
                </div>
              </motion.div>

              {/* Card 3: Buns */}
              <motion.div
                className="food-preview-card card-buns"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80"
                  alt="Warm toasted sweet buns with butter, palkova and jam"
                  loading="eager"
                  className="preview-img"
                />
                <div className="card-scrim">
                  <span className="category-pill">03 • SWEET BUNS</span>
                  <div className="card-title">Palkova &amp; Butter Jam</div>
                  <div className="card-subtitle">Roadside Bakery Comfort • From ₹40</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-editorial-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: center;
        }

        @media (min-width: 960px) {
          .hero-editorial-grid {
            grid-template-columns: 1.15fr 1fr;
            gap: 48px;
          }
        }

        .food-triptych {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 540px) {
          .food-triptych {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
          }
          .card-momos {
            grid-column: 1 / -1;
            height: 220px;
          }
          .card-waffles, .card-buns {
            height: 180px;
          }
        }

        @media (min-width: 960px) {
          .card-momos {
            height: 240px;
          }
          .card-waffles, .card-buns {
            height: 190px;
          }
        }

        .food-preview-card {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          height: 190px;
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.85) contrast(1.05);
          transition: transform 0.4s ease;
        }

        .food-preview-card:hover .preview-img {
          transform: scale(1.04);
        }

        .card-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(13,13,15,0.1) 0%, rgba(13,13,15,0.85) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px;
        }

        .category-pill {
          align-self: flex-start;
          background: rgba(13,13,15,0.75);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.15);
          color: var(--color-cream);
          font-size: 0.68rem;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .card-subtitle {
          font-size: 0.78rem;
          color: var(--color-cream-muted);
          margin-top: 2px;
        }
      `}</style>
    </section>
  );
};
