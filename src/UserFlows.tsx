import React from 'react';

const Screen = ({ title, x, y }: { title: string; x: number; y: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect width="200" height="350" rx="10" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
    <text x="100" y="30" textAnchor="middle" className="font-bold text-lg">{title}</text>
    <rect x="20" y="50" width="160" height="20" rx="4" fill="#CBD5E1" />
    <rect x="20" y="80" width="160" height="100" rx="4" fill="#E2E8F0" />
    <rect x="20" y="200" width="160" height="100" rx="4" fill="#E2E8F0" />
  </g>
);

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)" />
);

export const UserFlows = () => {
  return (
    <svg width="1000" height="800" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
        </marker>
      </defs>

      <Screen title="Today" x="400" y="50" />
      <Screen title="Tasks" x="100" y="400" />
      <Screen title="Connect" x="400" y="400" />
      <Screen title="Me" x="700" y="400" />

      {/* Flows */}
      <Arrow x1="450" y1="400" x2="450" y2="200" /> {/* Today -> Connect */}
      <Arrow x1="300" y1="200" x2="200" y2="400" /> {/* Today -> Tasks */}
      <Arrow x1="600" y1="200" x2="750" y2="400" /> {/* Today -> Me */}
    </svg>
  );
};
