import React, { useState } from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { SAUCE_OPTIONS } from '../data/menuData';

interface FoodWorldsProps {
  onSelectCategory: (category: 'momos' | 'waffles' | 'buns') => void;
}

export const FoodWorlds: React.FC<FoodWorldsProps> = ({ onSelectCategory }) => {
  const [activeSauceId, setActiveSauceId] = useState(SAUCE_OPTIONS[0].id);

  const activeSauce = SAUCE_OPTIONS.find(s => s.id === activeSauceId) || SAUCE_OPTIONS[0];

  return (
    <section id="three-worlds" style={{ borderBottom: '1px solid var(--color-border)' }}>
      {/* =========================================================================
          WORLD 01: MOMOS & PAN-FRY SAUCE EMBERS
          ========================================================================= */}
      <div
        className="food-world-section momos-world"
        style={{
          padding: 'clamp(56px, 8vw, 96px) 0',
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
          <div className="world-header-row">
            <div>
              <span className="world-eyebrow font-mono">WORLD 01 • STEAM &amp; WOK FIRE</span>
              <h2 className="world-title">MOMOS &amp; SIGNATURE SAUCES</h2>
            </div>
            <button
              onClick={() => onSelectCategory('momos')}
              className="btn-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              <span>View All Momos</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="momos-interactive-grid">
            {/* Visual Column */}
            <div className="momo-image-container">
              <img
                src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80"
                alt="Pan-seared momos tossed with chili garlic sauce"
                className="momo-feature-img"
              />
              <div className="momo-badge-overlay">
                <Flame size={16} color="var(--color-orange)" />
                <span>Pan Fry Preparation • +₹50 per portion</span>
              </div>
            </div>

            {/* Sauce Selection Experience */}
            <div className="sauce-showcase-box">
              <div style={{ marginBottom: '16px' }}>
                <span className="sub-heading-pill">5 PAN-FRY SIGNATURES</span>
                <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Choose any momo variety (Veg, Corn, Paneer, Chicken, Mixed) and pan-toss it live in your favorite sauce.
                </p>
              </div>

              {/* Interactive Sauce List */}
              <div className="sauce-pill-list">
                {SAUCE_OPTIONS.map((sauce) => {
                  const isSelected = sauce.id === activeSauceId;
                  return (
                    <button
                      key={sauce.id}
                      onClick={() => setActiveSauceId(sauce.id)}
                      className={`sauce-select-btn ${isSelected ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sauce.name}</span>
                        <span className="sauce-price-tag font-mono">+₹{sauce.price}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="spice-meter">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span
                              key={i}
                              style={{
                                color: i < sauce.spiceLevel ? 'var(--color-orange)' : 'rgba(255,255,255,0.15)',
                                fontSize: '0.75rem'
                              }}
                            >
                              🔥
                            </span>
                          ))}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-cream-dim)' }}>{sauce.tag}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Sauce Detail Card */}
              <div className="active-sauce-detail">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-orange)' }}>
                    Active Flavor Note
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-cream-dim)' }}>
                    Cooked live to order
                  </span>
                </div>
                <p style={{ color: 'var(--color-cream)', fontSize: '0.92rem', lineHeight: 1.45 }}>
                  {activeSauce.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          WORLD 02: WAFFLES & CHOCOLATE GRID
          ========================================================================= */}
      <div
        className="food-world-section waffles-world"
        style={{
          padding: 'clamp(56px, 8vw, 96px) 0',
          backgroundColor: 'var(--color-surface-1)',
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
          <div className="world-header-row">
            <div>
              <span className="world-eyebrow font-mono" style={{ color: 'var(--color-accent-gold)' }}>
                WORLD 02 • GOLDEN CAST IRON
              </span>
              <h2 className="world-title">CRISP WAFFLES &amp; BELGIAN COCOA</h2>
            </div>
            <button
              onClick={() => onSelectCategory('waffles')}
              className="btn-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              <span>View All 8 Waffles</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Asymmetric Waffle Grid Layout */}
          <div className="waffle-asymmetric-grid">
            {/* Visual Hero */}
            <div className="waffle-feature-card">
              <img
                src="https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=1000&q=80"
                alt="Golden crispy waffle with chocolate drizzle"
                className="waffle-feature-img"
              />
              <div className="waffle-overlay">
                <span className="waffle-tag font-mono">FROM ₹50</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                  Pressed Golden &amp; Crisp
                </h3>
                <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.85rem' }}>
                  8 curated varieties from Single Piece to Triple Choco &amp; ButterScotch.
                </p>
              </div>
            </div>

            {/* Variety Highlights */}
            <div className="waffle-varieties-list">
              <div className="waffle-item-box">
                <div className="waffle-name">Triple Choco</div>
                <div className="waffle-price font-mono">₹120</div>
                <p className="waffle-detail">White, milk, and dark chocolate cascading in every pocket.</p>
              </div>

              <div className="waffle-item-box">
                <div className="waffle-name">ButterScotch</div>
                <div className="waffle-price font-mono">₹100</div>
                <p className="waffle-detail">Caramel glaze infused with crunchy roasted praline crisps.</p>
              </div>

              <div className="waffle-item-box">
                <div className="waffle-name">Hazelnut</div>
                <div className="waffle-price font-mono">₹100</div>
                <p className="waffle-detail">Rich nutty cocoa cream spread thick over piping hot waffle.</p>
              </div>

              <div className="waffle-item-box">
                <div className="waffle-name">Dark / White / Milk</div>
                <div className="waffle-price font-mono">₹80 – ₹100</div>
                <p className="waffle-detail">Pure single-origin ganache drizzles melted to smooth perfection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          WORLD 03: BUNS & ROADSIDE BAKERY WARMTH
          ========================================================================= */}
      <div
        className="food-world-section buns-world"
        style={{
          padding: 'clamp(56px, 8vw, 96px) 0',
          backgroundColor: '#0D0D0F'
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
          <div className="world-header-row">
            <div>
              <span className="world-eyebrow font-mono" style={{ color: '#F59E0B' }}>
                WORLD 03 • TEA-STALL NOSTALGIA
              </span>
              <h2 className="world-title">TOASTED SWEET BUNS</h2>
              <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Authentic South Indian bakery sweet buns toasted with traditional palkova, butter jam, and gulkand. (No burgers!).
              </p>
            </div>
            <button
              onClick={() => onSelectCategory('buns')}
              className="btn-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              <span>View All Buns</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 4 Buns Horizontal Strip Showcase */}
          <div className="buns-strip-grid">
            <div className="bun-strip-card">
              <div className="bun-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80"
                  alt="Bun Butter Jam"
                  className="bun-card-img"
                />
              </div>
              <div className="bun-card-body">
                <div className="bun-card-header">
                  <span className="bun-title">Bun Butter Jam</span>
                  <span className="bun-cost font-mono">₹40</span>
                </div>
                <p className="bun-desc">Split bun slathered with salted butter and mixed fruit jam.</p>
              </div>
            </div>

            <div className="bun-strip-card">
              <div className="bun-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                  alt="Bun Palkova"
                  className="bun-card-img"
                />
              </div>
              <div className="bun-card-body">
                <div className="bun-card-header">
                  <span className="bun-title">Bun Palkova (Pakova)</span>
                  <span className="bun-cost font-mono">₹50</span>
                </div>
                <p className="bun-desc">Traditional slow-cooked milk sweet stuffed inside a soft warm bun.</p>
              </div>
            </div>

            <div className="bun-strip-card">
              <div className="bun-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                  alt="Bun Gulkand"
                  className="bun-card-img"
                />
              </div>
              <div className="bun-card-body">
                <div className="bun-card-header">
                  <span className="bun-title">Bun Gulkand</span>
                  <span className="bun-cost font-mono">₹50</span>
                </div>
                <p className="bun-desc">Aromatic sun-preserved rose petal spread layered with butter.</p>
              </div>
            </div>

            <div className="bun-strip-card">
              <div className="bun-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80"
                  alt="Choco Bun"
                  className="bun-card-img"
                />
              </div>
              <div className="bun-card-body">
                <div className="bun-card-header">
                  <span className="bun-title">Choco Bun</span>
                  <span className="bun-cost font-mono">₹50</span>
                </div>
                <p className="bun-desc">Warm bun filled with velvety chocolate fudge spread.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .world-header-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        @media (min-width: 768px) {
          .world-header-row {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }

        .world-eyebrow {
          font-size: 0.75rem;
          color: var(--color-orange);
          letter-spacing: 0.12em;
          margin-bottom: 6px;
          display: block;
          font-weight: 700;
        }

        .world-title {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          line-height: 1.1;
          color: var(--color-cream);
          letter-spacing: -0.025em;
        }

        /* Momos layout */
        .momos-interactive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
        }

        @media (min-width: 900px) {
          .momos-interactive-grid {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }
        }

        .momo-image-container {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          height: clamp(280px, 40vw, 420px);
          border: 1px solid var(--color-border);
        }

        .momo-feature-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .momo-badge-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(13, 13, 15, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid var(--color-orange-border);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--color-cream);
          font-weight: 600;
        }

        .sauce-showcase-box {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 24px;
        }

        .sub-heading-pill {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--color-orange);
          background: var(--color-orange-subtle);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-weight: 700;
        }

        .sauce-pill-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .sauce-select-btn {
          background: var(--color-surface-1);
          border: 1px solid var(--color-border);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--color-cream);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .sauce-select-btn:hover {
          border-color: var(--color-orange-border);
        }

        .sauce-select-btn.active {
          background: rgba(223, 74, 24, 0.1);
          border-color: var(--color-orange);
        }

        .sauce-price-tag {
          font-size: 0.85rem;
          color: var(--color-orange);
          font-weight: 700;
        }

        .active-sauce-detail {
          background: var(--color-surface-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 14px;
        }

        /* Waffle layout */
        .waffle-asymmetric-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 900px) {
          .waffle-asymmetric-grid {
            grid-template-columns: 1.1fr 1fr;
            align-items: stretch;
          }
        }

        .waffle-feature-card {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--color-border);
          min-height: 280px;
        }

        .waffle-feature-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .waffle-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(13,13,15,0.2) 0%, rgba(13,13,15,0.92) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
        }

        .waffle-tag {
          align-self: flex-start;
          background: var(--color-accent-gold);
          color: #0D0D0F;
          font-weight: 800;
          font-size: 0.72rem;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .waffle-varieties-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 500px) {
          .waffle-varieties-list {
            grid-template-columns: 1fr 1fr;
          }
        }

        .waffle-item-box {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 18px;
          display: flex;
          flex-direction: column;
        }

        .waffle-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--color-cream);
        }

        .waffle-price {
          color: var(--color-accent-gold);
          font-size: 0.95rem;
          font-weight: 700;
          margin: 4px 0 8px 0;
        }

        .waffle-detail {
          color: var(--color-cream-dim);
          font-size: 0.84rem;
          line-height: 1.4;
        }

        /* Buns layout */
        .buns-strip-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 600px) {
          .buns-strip-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .buns-strip-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .bun-strip-card {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .bun-card-img-wrap {
          height: 140px;
          overflow: hidden;
          background: var(--color-surface-3);
        }

        .bun-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .bun-strip-card:hover .bun-card-img {
          transform: scale(1.05);
        }

        .bun-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .bun-card-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .bun-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-cream);
        }

        .bun-cost {
          color: #F59E0B;
          font-weight: 700;
          font-size: 0.92rem;
        }

        .bun-desc {
          color: var(--color-cream-dim);
          font-size: 0.82rem;
          line-height: 1.4;
        }
      `}</style>
    </section>
  );
};
