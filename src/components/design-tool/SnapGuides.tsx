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
        const isYellowGuide = guide.color === '#FFD700';
        const lineWidth = isYellowGuide ? 3 : 2;

        if (guide.type === 'vertical') {
          return (
            <div
              key={guide.id}
              className="absolute"
              style={{
                left: guide.position,
                top: 0,
                width: `${lineWidth}px`,
                height: '100%',
                backgroundColor: guide.color,
                boxShadow: isYellowGuide
                  ? `0 0 12px 3px ${guide.color}, 0 0 20px 6px ${guide.color}, 0 0 30px 9px rgba(255, 215, 0, 0.3)`
                  : `0 0 8px 2px ${guide.color}, 0 0 16px 4px ${guide.color}`,
                opacity: 1,
                transform: `translateX(-${lineWidth / 2}px)`,
                animation: 'snapPulse 0.8s ease-in-out infinite'
              }}
            />
          );
        } else {
          return (
            <div
              key={guide.id}
              className="absolute"
              style={{
                left: 0,
                top: guide.position,
                width: '100%',
                height: `${lineWidth}px`,
                backgroundColor: guide.color,
                boxShadow: isYellowGuide
                  ? `0 0 12px 3px ${guide.color}, 0 0 20px 6px ${guide.color}, 0 0 30px 9px rgba(255, 215, 0, 0.3)`
                  : `0 0 8px 2px ${guide.color}, 0 0 16px 4px ${guide.color}`,
                opacity: 1,
                transform: `translateY(-${lineWidth / 2}px)`,
                animation: 'snapPulse 0.8s ease-in-out infinite'
              }}
            />
          );
        }
      })}
      <style>{`
        @keyframes snapPulse {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }
          50% {
            opacity: 0.7;
            filter: brightness(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default SnapGuides;