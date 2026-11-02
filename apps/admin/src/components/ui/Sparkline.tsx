import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({
  data = [],
  color = 'var(--accent)',
  height = 40,
  className,
  ...props
}: SparklineProps) {
  const rawId = React.useId();
  const gradId = `sparkline-grad-${rawId.replace(/[:]/g, '')}`;

  if (data.length < 2) {
    return <div style={{ height }} className={cn('w-full', className)} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 100;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathData = points.join(' ');
  const areaData = `0,${height} ${pathData} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full overflow-visible', className)}
      style={{ height }}
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      <polygon points={areaData} fill={`url(#${gradId})`} />

      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pathData}
      />
    </svg>
  );
}
