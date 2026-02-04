import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useMotionValue(0);
  const opacity = useTransform(pullDistance, [0, 80], [0, 1]);
  const scale = useTransform(pullDistance, [0, 80], [0.5, 1]);

  const threshold = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setCanRefresh(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!canRefresh || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;
      
      if (distance > 0) {
        e.preventDefault();
        pullDistance.set(Math.min(distance * 0.5, 100));
      }
    };

    const handleTouchEnd = async () => {
      if (!canRefresh || isRefreshing) return;
      
      const distance = pullDistance.get();
      setCanRefresh(false);

      if (distance >= threshold) {
        setIsRefreshing(true);
        pullDistance.set(60);
        
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            pullDistance.set(0);
            setIsRefreshing(false);
          }, 300);
        }
      } else {
        pullDistance.set(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canRefresh, isRefreshing, onRefresh, pullDistance]);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto overscroll-none">
      <motion.div
        style={{ 
          y: pullDistance,
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 10
        }}
      >
        <motion.div style={{ opacity, scale }}>
          <Loader2 className={cn(
            "w-6 h-6 text-emerald-600",
            isRefreshing && "animate-spin"
          )} />
        </motion.div>
      </motion.div>
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}