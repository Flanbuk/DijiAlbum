'use client';

import dynamic from 'next/dynamic';
import { Film } from 'lucide-react';

const CameraView = dynamic(() => import('./CameraView'), {
  ssr: false,
  loading: () => (
    <div className="z-20 flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-center">
      <Film className="w-10 h-10 text-neutral-700 animate-pulse mb-3" />
      <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
        Lens Calibration Init...
      </div>
    </div>
  )
});

export default function CameraPage() {
  return <CameraView />;
}
