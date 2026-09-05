import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
  color?: string;
  delay?: number;
}

function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    function tick(time: number) {
      if (!startTime.current) startTime.current = time;
      const elapsed = time - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export default function StatCard({ label, value, suffix = '', icon, color, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const count = useCounter(visible ? value : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onAnimationComplete={() => setVisible(true)}
      className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300 cursor-default"
      style={{ boxShadow: color ? `0 0 30px ${color}22` : '' }}
    >
      {icon && (
        <div className="text-3xl mb-3">{icon}</div>
      )}
      <div className="text-3xl md:text-4xl font-black mb-1"
        style={{ fontFamily: 'Poppins, sans-serif', color: color || 'var(--accent)' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}
