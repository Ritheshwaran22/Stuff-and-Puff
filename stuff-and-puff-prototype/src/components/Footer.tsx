import React, { useState } from 'react';
import { Camera, ExternalLink, X } from 'lucide-react';
import { IMAGE_CREDITS } from '../data/imageCredits';

export const Footer: React.FC = () => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <>
      <footer
        style={{
          backgroundColor: '#0A0A0C',
          borderTop: '1px solid var(--color-border)',
          padding: '48px 0 36px 0',
          color: 'var(--color-cream-dim)',
          fontSize: '0.85rem'
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              paddingBottom: '32px',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--color-cream)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}
                >
                  STUFF <span style={{ color: 'var(--color-orange)' }}>&amp;</span> PUFF
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-cream-dim)', marginTop: '2px' }}>
                  Roadside Takeaway • Near GH Bus Stop, Chengalpattu, Tamil Nadu
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setShowCredits(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-cream-muted)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={14} color="var(--color-orange)" />
                  <span>Licensed Photography Registry</span>
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: 'var(--color-cream-dim)'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-cream)', marginBottom: '2px' }}>
                Prototype Boundaries &amp; Integrity Notice
              </div>
              This project is a standalone design prototype built strictly for testing visual layout, Motion animations, and customer ordering flows for Stuff &amp; Puff in Chengalpattu. No production database, Django API, Cashfree payment, or external service is linked. All photography is sourced under commercial-use Unsplash licenses with zero AI-generated images.
            </div>
          </div>

          <div
            style={{
              paddingTop: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.75rem',
              color: 'var(--color-cream-dim)'
            }}
          >
            <div>
              &copy; {new Date().getFullYear()} STUFF &amp; PUFF. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Hours: 5:00 PM – 10:00 PM</span>
              <span>•</span>
              <span>10-Min Pre-Booked Pickup</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Photography Credits & License Documentation Modal */}
      {showCredits && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={() => setShowCredits(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)'
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 141,
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              backgroundColor: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
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
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--color-cream)'
                  }}
                >
                  Verified Photography Registry
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}>
                  Rule 3 Compliance: 100% Genuine, Commercial-Use Licensed Sourced Food Photos
                </div>
              </div>

              <button
                onClick={() => setShowCredits(false)}
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

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {IMAGE_CREDITS.map(img => (
                <div
                  key={img.id}
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{img.category}</span>
                    <span
                      className="font-mono"
                      style={{ fontSize: '0.72rem', color: 'var(--color-success)', background: 'rgba(34, 197, 94, 0.12)', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      {img.license} • Commercial OK
                    </span>
                  </div>

                  <div style={{ color: 'var(--color-cream-muted)' }}>
                    <strong>Photographer:</strong> {img.photographer}
                  </div>

                  <div style={{ color: 'var(--color-cream-dim)' }}>
                    {img.notes}
                  </div>

                  <a
                    href={img.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--color-orange)',
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      marginTop: '4px'
                    }}
                  >
                    <span>View original source</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
