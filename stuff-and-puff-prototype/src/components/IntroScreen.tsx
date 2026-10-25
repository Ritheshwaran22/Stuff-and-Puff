import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1100);

    return () => clearTimeout(timer);
  }, [shouldReduceMotion, onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="intro-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
          onClick={handleDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#0D0D0F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '24px',
            userSelect: 'none'
          }}
          aria-label="Click anywhere to skip introduction"
        >
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                display: 'inline-block',
                border: '1px solid rgba(223, 74, 24, 0.4)',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-orange)',
                letterSpacing: '0.14em',
                marginBottom: '16px',
                textTransform: 'uppercase'
              }}
            >
              CHENGALPATTU • STREET FOOD
            </motion.div>

            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 7vw, 3.4rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                color: 'var(--color-cream)',
                letterSpacing: '-0.03em',
                marginBottom: '12px'
              }}
            >
              STUFF <span style={{ color: 'var(--color-orange)' }}>&amp;</span> PUFF
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              style={{
                color: 'var(--color-cream-dim)',
                fontSize: '0.9rem',
                letterSpacing: '0.02em',
                marginBottom: '28px'
              }}
            >
              Hot Momos • Crispy Waffles • Fresh Buns
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-cream-dim)',
                letterSpacing: '0.05em'
              }}
            >
              Tap to enter &rarr;
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
