import type { Variants, Transition } from 'framer-motion';

// ─── Page Transitions ──────────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition: Transition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.4,
};

// ─── Fade Variants ─────────────────────────────────────────────────────────────
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Stagger Container ─────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ─── Slide Variants ────────────────────────────────────────────────────────────
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ─── Card Hover ────────────────────────────────────────────────────────────────
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -6, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── Modal Variants ────────────────────────────────────────────────────────────
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.85, y: 40 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

// ─── Sidebar Variants ──────────────────────────────────────────────────────────
export const sidebarVariants: Variants = {
  expanded: { width: 260, transition: { duration: 0.3, ease: 'easeInOut' } },
  collapsed: { width: 72, transition: { duration: 0.3, ease: 'easeInOut' } },
};

// ─── Drawer Variants ───────────────────────────────────────────────────────────
export const drawerVariants: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { x: '-100%', transition: { duration: 0.25, ease: 'easeIn' } },
};

// ─── Number Counter ────────────────────────────────────────────────────────────
export const counterVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── Hero Text ─────────────────────────────────────────────────────────────────
export const heroTitle: Variants = {
  initial: { opacity: 0, y: 60, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const heroSubtitle: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: 'easeOut' } },
};

export const heroButtons: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4, ease: 'easeOut' } },
};
