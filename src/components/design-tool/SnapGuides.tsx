import React from 'react';
import { SnapGuide } from '../../hooks/useSnapping';

interface SnapGuidesProps {
  guides: SnapGuide[];
  canvasSize: { width: number; height: number };
  zoom: number;
  pan: { x: number; y: number };
}

const SnapGuides: React.FC<SnapGuidesProps> = ({ guides, canvasSize, zoom, pan }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {guides.map((guide) => {
        if (guide.type === 'vertical') {
          return (
            <div
              key={guide.id}
              className="absolute animate-pulse"
              style={{
                left: guide.position * zoom + pan.x,
                top: 0,
                width: '1px',
                height: '100%',
                backgroundColor: guide.color,
                boxShadow: `0 0 4px ${guide.color}`,
                opacity: 0.8,
                transform: 'translateX(-0.5px)'
              }}
            />
          );
        } else {
          return (
            <div
              key={guide.id}
              className="absolute animate-pulse"
              style={{
                left: 0,
                top: guide.position * zoom + pan.y,
                width: '100%',
                height: '1px',
                backgroundColor: guide.color,
                boxShadow: `0 0 4px ${guide.color}`,
                opacity: 0.8,
                transform: 'translateY(-0.5px)'
              }}
            />
          );
        }
      })}
    </div>
  );
};

export default SnapGuides;