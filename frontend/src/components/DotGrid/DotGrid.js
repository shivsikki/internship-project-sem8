import React, { useState, useEffect, useMemo, useRef } from 'react';
import './DotGrid.css';

const DOT_SPACING = 36;
const HOVER_RADIUS = 80;
const MAX_SCALE = 10;

const Dot = React.memo(({ x, y, mouseX, mouseY }) => {
  const dx = x - mouseX;
  const dy = y - mouseY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const scale = distance > HOVER_RADIUS
    ? 1
    : 1 + (1 - distance / HOVER_RADIUS) * (MAX_SCALE - 1);

  return (
    <div
      className="dot-grid-dot"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    />
  );
});

const DotGrid = () => {
  const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 });
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  const rafRef = useRef(null);
  const lastPosRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const handleMove = (e) => {
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setMousePos({ ...lastPosRef.current });
        rafRef.current = null;
      });
    };
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const dots = useMemo(() => {
    const cols = Math.ceil(dimensions.width / DOT_SPACING) + 2;
    const rows = Math.ceil(dimensions.height / DOT_SPACING) + 2;
    const result = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({
          id: `${col}-${row}`,
          x: col * DOT_SPACING,
          y: row * DOT_SPACING,
        });
      }
    }
    return result;
  }, [dimensions.width, dimensions.height]);

  return (
    <div className="dot-grid-bg" aria-hidden="true">
      <div className="dot-grid-pattern">
        {dots.map((dot) => (
          <Dot
            key={dot.id}
            x={dot.x}
            y={dot.y}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
          />
        ))}
      </div>
    </div>
  );
};

export default DotGrid;
