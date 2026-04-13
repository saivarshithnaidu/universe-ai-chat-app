'use client';

import React, { Suspense } from 'react';

const SplineScene = React.lazy(() => import('@splinetool/react-spline'));

interface SplineProps {
  scene: string;
  className?: string;
}

function SplineLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        <span className="text-xs text-white/30 font-medium">Loading 3D scene…</span>
      </div>
    </div>
  );
}

export function Spline({ scene, className = '' }: SplineProps) {
  return (
    <Suspense fallback={<SplineLoader />}>
      <SplineScene
        scene={scene}
        className={className}
        style={{ width: '100%', height: '100%' }}
      />
    </Suspense>
  );
}
