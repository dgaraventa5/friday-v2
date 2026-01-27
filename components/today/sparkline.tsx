'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
  animate?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = 'currentColor',
  showDots = false,
  className,
  animate = true,
}: SparklineProps) {
  const { path, dots, maxY } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', dots: [], maxY: 0 };
    }

    // Find min/max for scaling
    const maxVal = Math.max(...data, 1); // At least 1 to avoid division by zero
    const minVal = 0; // Always start from 0 for consistency

    // Padding to prevent clipping at edges
    const paddingX = 4;
    const paddingY = 4;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    // Calculate points
    const points = data.map((value, index) => {
      const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth;
      // Invert Y since SVG Y grows downward
      const y = paddingY + chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, value };
    });

    // Create smooth path using cubic bezier curves
    if (points.length < 2) {
      return { path: '', dots: points, maxY: maxVal };
    }

    let pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const prevPrev = points[i - 2];

      // Calculate control points for smooth curve
      const tension = 0.3;

      let cp1x: number, cp1y: number;
      if (prevPrev) {
        cp1x = prev.x + (curr.x - prevPrev.x) * tension;
        cp1y = prev.y + (curr.y - prevPrev.y) * tension;
      } else {
        cp1x = prev.x + (curr.x - prev.x) * tension;
        cp1y = prev.y;
      }

      let cp2x: number, cp2y: number;
      if (next) {
        cp2x = curr.x - (next.x - prev.x) * tension;
        cp2y = curr.y - (next.y - prev.y) * tension;
      } else {
        cp2x = curr.x - (curr.x - prev.x) * tension;
        cp2y = curr.y;
      }

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    return { path: pathD, dots: points, maxY: maxVal };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={cn('text-slate-300 dark:text-slate-600', className)}
        role="img"
        aria-label="No data available"
      >
        <line
          x1={4}
          y1={height / 2}
          x2={width - 4}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`Sparkline showing ${data.length} data points, max value ${maxY}`}
    >
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          animate && 'motion-safe:animate-[sparkline-draw_1s_ease-out_forwards]'
        )}
        style={animate ? {
          strokeDasharray: width * 2,
          strokeDashoffset: width * 2,
        } : undefined}
      />

      {/* Optional dots at data points */}
      {showDots && dots.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === dots.length - 1 ? 3 : 2}
          fill={color}
          className={cn(
            animate && 'motion-safe:animate-[sparkline-dot_0.3s_ease-out_forwards]',
            'opacity-0'
          )}
          style={animate ? {
            animationDelay: `${0.8 + index * 0.05}s`,
          } : { opacity: 1 }}
        />
      ))}

      {/* Highlight the last/current point */}
      {dots.length > 0 && (
        <circle
          cx={dots[dots.length - 1].x}
          cy={dots[dots.length - 1].y}
          r={4}
          fill={color}
          opacity={0.3}
          className={cn(
            animate && 'motion-safe:animate-[sparkline-pulse_2s_ease-in-out_infinite]'
          )}
          style={animate ? {
            animationDelay: '1s',
          } : undefined}
        />
      )}
    </svg>
  );
}
