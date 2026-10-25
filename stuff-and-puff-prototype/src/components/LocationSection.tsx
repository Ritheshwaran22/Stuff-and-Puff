import React from 'react';
import { MapPin, Clock, Navigation, ExternalLink } from 'lucide-react';
import { SHOP_METADATA } from '../data/menuData';

export const LocationSection: React.FC = () => {
  return (
    <section
      id="location"
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
        <div className="location-grid">
          {/* Details Column */}
          <div className="location-info-card">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--color-orange)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'block',
                marginBottom: '8px'
              }}
            >
              ROAD TAKEAWAWAY POINT
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: 'var(--color-cream)',
                marginBottom: '16px'
              }}
            >
              FIND OUR PUSHCART
            </h2>

            <p style={{ color: 'var(--color-cream-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '28px' }}>
              We operate exclusively as a freshly cooked roadside takeaway. When your 10-minute pickup slot arrives, walk up to our pushcart and quote your order token.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={20} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '1rem' }}>
                    Near GH Bus Stop
                  </div>
                  <div style={{ color: 'var(--color-cream-dim)', fontSize: '0.86rem' }}>
                    Chengalpattu, Tamil Nadu — 603001
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={20} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '1rem' }}>
                    5:00 PM – 10:00 PM
                  </div>
                  <div style={{ color: 'var(--color-cream-dim)', fontSize: '0.86rem' }}>
                    Open every evening • Online slot booking active
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Navigation size={20} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '1rem' }}>
                    Landmark Guide
                  </div>
                  <div style={{ color: 'var(--color-cream-dim)', fontSize: '0.86rem' }}>
                    Directly adjacent to the Government Hospital (GH) main bus stop shelter on the highway road.
                  </div>
                </div>
              </div>
            </div>

            <a
              href={SHOP_METADATA.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ display: 'inline-flex', gap: '8px', fontSize: '0.9rem' }}
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={15} />
            </a>
          </div>

          {/* Clean Stylized Vector Map Graphic */}
          <div className="location-visual-map">
            <svg
              viewBox="0 0 500 380"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22222A" strokeWidth="1" />
                </pattern>
                <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#DF4A18" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#DF4A18" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="100%" height="100%" fill="#121216" />
              <rect width="100%" height="100%" fill="url(#mapGrid)" />

              <path
                d="M -20,180 Q 200,160 520,200"
                stroke="#2E2E38"
                strokeWidth="24"
                fill="none"
              />
              <path
                d="M -20,180 Q 200,160 520,200"
                stroke="#DF4A18"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                opacity="0.6"
              />

              <path
                d="M 260,-20 L 250,400"
                stroke="#282833"
                strokeWidth="16"
                fill="none"
              />

              <rect x="70" y="80" width="130" height="70" rx="6" fill="#1C1C24" stroke="#2B2B36" />
              <text x="135" y="118" fill="#888894" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
                GOVT HOSPITAL (GH)
              </text>
              <text x="135" y="132" fill="#5E5E6B" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
                CAMPUS ENTRANCE
              </text>

              <rect x="310" y="220" width="140" height="60" rx="6" fill="#1C1C24" stroke="#2B2B36" />
              <text x="380" y="254" fill="#888894" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
                CHENGALPATTU JUNCTION
              </text>

              <rect x="200" y="145" width="80" height="24" rx="4" fill="#2E2A27" stroke="#DF4A18" strokeWidth="1" />
              <text x="240" y="160" fill="#E8DFD8" fontSize="9" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">
                GH BUS STOP
              </text>

              <circle cx="270" cy="195" r="38" fill="url(#radarPulse)" />
              <circle cx="270" cy="195" r="14" fill="#DF4A18" />
              <circle cx="270" cy="195" r="6" fill="#FFFFFF" />

              <g transform="translate(250, 100)">
                <rect x="0" y="0" width="160" height="48" rx="8" fill="#1A1A22" stroke="#DF4A18" strokeWidth="1.5" />
                <polygon points="20,48 26,58 32,48" fill="#1A1A22" stroke="#DF4A18" strokeWidth="1.5" />
                <rect x="18" y="46" width="16" height="4" fill="#1A1A22" />
                <text x="12" y="20" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="800">
                  STUFF &amp; PUFF CART
                </text>
                <text x="12" y="36" fill="#A0A0AD" fontSize="9" fontFamily="sans-serif">
                  Pickup Point • Open 5–10 PM
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        .location-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: center;
        }

        @media (min-width: 900px) {
          .location-grid {
            grid-template-columns: 1fr 1.15fr;
            gap: 48px;
          }
        }

        .location-info-card {
          display: flex;
          flex-direction: column;
        }

        .location-visual-map {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0,0,0,0.4);
        }
      `}</style>
    </section>
  );
};
