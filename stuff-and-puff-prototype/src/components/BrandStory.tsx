import React from 'react';
import { Flame, Clock, ShieldCheck } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section
      id="story"
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
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--color-orange)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontWeight: 700
            }}
          >
            THE STUFF &amp; PUFF ETHOS
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--color-cream)',
              marginBottom: '24px'
            }}
          >
            HOT. FRESH. <br />
            <span style={{ color: 'var(--color-orange)' }}>MADE TO ORDER.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--color-cream-muted)',
              lineHeight: 1.6,
              marginBottom: '48px',
              fontWeight: 300
            }}
          >
            Roadside food tastes best the moment it leaves the fire. At our pushcart near GH Bus Stop, nothing sits under heat lamps. You pre-book your 10-minute pickup slot, we time cooking with a strict 20-minute preparation buffer, and hand you piping hot food right when you pull up.
          </p>
        </div>

        {/* 3 Pillars / Practical Process */}
        <div className="story-pillars-grid">
          <div className="pillar-item">
            <div className="pillar-num font-mono">01</div>
            <div className="pillar-header">
              <Flame size={20} color="var(--color-orange)" />
              <h3 className="pillar-title">Live Wok &amp; Press</h3>
            </div>
            <p className="pillar-desc">
              Momos pan-tossed in signature sauces and waffles pressed fresh on cast iron upon order confirmation.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num font-mono">02</div>
            <div className="pillar-header">
              <Clock size={20} color="var(--color-orange)" />
              <h3 className="pillar-title">10-Minute Slots</h3>
            </div>
            <p className="pillar-desc">
              We cap each pickup slot at 2 orders to guarantee zero crowding and zero compromise on heat.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-num font-mono">03</div>
            <div className="pillar-header">
              <ShieldCheck size={20} color="var(--color-orange)" />
              <h3 className="pillar-title">Tokenized Handover</h3>
            </div>
            <p className="pillar-desc">
              Show your unique order token at the cart for immediate pickup. No long roadside lines.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .story-pillars-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .story-pillars-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
        }

        .pillar-item {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .pillar-num {
          font-size: 0.8rem;
          color: var(--color-cream-dim);
          margin-bottom: 12px;
          font-weight: 700;
        }

        .pillar-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .pillar-title {
          font-size: 1.15rem;
          color: var(--color-cream);
          font-family: var(--font-display);
          font-weight: 700;
        }

        .pillar-desc {
          color: var(--color-cream-dim);
          font-size: 0.92rem;
          line-height: 1.5;
        }
      `}</style>
    </section>
  );
};
