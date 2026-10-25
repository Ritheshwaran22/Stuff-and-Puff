import React, { useMemo } from 'react';
import { Clock, Check } from 'lucide-react';
import type { PickupSlot } from '../types';
import { SHOP_METADATA } from '../data/menuData';

interface PickupSlotSelectorProps {
  selectedSlot: PickupSlot | null;
  onSelectSlot: (slot: PickupSlot) => void;
}

export const PickupSlotSelector: React.FC<PickupSlotSelectorProps> = ({
  selectedSlot,
  onSelectSlot
}) => {
  const slots: PickupSlot[] = useMemo(() => {
    const list: PickupSlot[] = [];
    const startHour = SHOP_METADATA.openingTimeHour; // 17 (5:00 PM)
    const endHour = SHOP_METADATA.closingTimeHour; // 22 (10:00 PM)

    // Pre-configured booked slots for testing the fully booked simulation requirement
    const bookedTimeStrings = new Set(['05:20 PM', '06:00 PM', '07:10 PM', '08:00 PM', '08:40 PM']);

    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += SHOP_METADATA.slotIntervalMins) {
        if (h === endHour && m > 0) break; // stops at 10:00 PM

        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : h;
        const formattedHour = String(displayHour).padStart(2, '0');
        const formattedMin = String(m).padStart(2, '0');
        const timeStr = `${formattedHour}:${formattedMin} ${period}`;

        const isBooked = bookedTimeStrings.has(timeStr);

        list.push({
          timeStr,
          rawHour: h,
          rawMinute: m,
          isAvailable: !isBooked,
          isBooked,
          reason: isBooked ? 'Slot Full (2/2 orders reached)' : undefined
        });
      }
    }
    return list;
  }, []);

  return (
    <div className="pickup-slot-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--color-orange)" />
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-cream)'
            }}
          >
            Select 10-Minute Pickup Slot
          </h4>
        </div>
        <span
          className="font-mono"
          style={{ fontSize: '0.74rem', color: 'var(--color-cream-dim)' }}
        >
          Asia/Kolkata (IST)
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.78rem',
          color: 'var(--color-cream-dim)',
          marginBottom: '16px'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-surface-3)' }} />
          Available
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-orange)' }} />
          Selected
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
          Booked (Max 2 Orders)
        </span>
        <span style={{ color: 'var(--color-cream-muted)', marginLeft: 'auto' }}>
          Buffer: 20 min cooking
        </span>
      </div>

      {/* Grid of slots */}
      <div className="slots-scroller-grid">
        {slots.map(slot => {
          const isSelected = selectedSlot?.timeStr === slot.timeStr;
          const isDisabled = slot.isBooked;

          return (
            <button
              key={slot.timeStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectSlot(slot)}
              className={`slot-pill-btn ${isSelected ? 'selected' : ''} ${isDisabled ? 'booked' : ''}`}
              title={slot.reason || `Select ${slot.timeStr}`}
            >
              <div className="slot-time font-mono">{slot.timeStr}</div>
              <div className="slot-badge">
                {isDisabled ? (
                  <span>FULL</span>
                ) : isSelected ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span>OPEN</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .pickup-slot-section {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 18px;
          margin-bottom: 20px;
        }

        .slots-scroller-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 8px;
          max-height: 210px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .slot-pill-btn {
          background: var(--color-surface-1);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          color: var(--color-cream);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          transition: all 0.12s ease;
          user-select: none;
        }

        .slot-pill-btn:hover:not(:disabled) {
          border-color: var(--color-orange-border);
          background: var(--color-surface-3);
        }

        .slot-pill-btn.selected {
          background: rgba(223, 74, 24, 0.15);
          border-color: var(--color-orange);
          color: #FFFFFF;
        }

        .slot-pill-btn.booked {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
          text-decoration: line-through;
        }

        .slot-time {
          font-size: 0.82rem;
          font-weight: 700;
        }

        .slot-badge {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--color-cream-dim);
          display: flex;
          align-items: center;
        }

        .slot-pill-btn.selected .slot-badge {
          color: var(--color-orange);
        }
      `}</style>
    </div>
  );
};
