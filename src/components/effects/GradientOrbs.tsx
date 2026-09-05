

export default function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary orb */}
      <div
        className="absolute rounded-full blur-3xl opacity-30 animate-float"
        style={{
          width: '600px', height: '600px',
          background: 'var(--accent)',
          top: '-200px', left: '-200px',
          animationDelay: '0s',
        }}
      />
      {/* Secondary orb */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-float"
        style={{
          width: '400px', height: '400px',
          background: 'var(--accent-secondary)',
          bottom: '-100px', right: '-100px',
          animationDelay: '2s',
        }}
      />
      {/* Tertiary orb */}
      <div
        className="absolute rounded-full blur-3xl opacity-15 animate-float"
        style={{
          width: '300px', height: '300px',
          background: 'var(--accent)',
          top: '40%', right: '25%',
          animationDelay: '4s',
        }}
      />
    </div>
  );
}
