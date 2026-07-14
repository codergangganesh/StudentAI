import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'block',
      }}
    />
  );
}
