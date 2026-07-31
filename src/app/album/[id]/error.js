'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Albüm Rotası Hatası:', error);
  }, [error]);

  return (
    <main className="relative flex flex-col items-center justify-center w-full min-h-screen bg-[#0A0A0A] px-4 text-center select-none text-neutral-100 font-sans">
      <div className="grain-overlay" />
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.15),transparent_70%)] z-10" />

      <div className="z-20 w-full max-w-sm bg-[#121212] border border-neutral-900 rounded-[28px] p-8 shadow-2xl flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-medium text-neutral-200 mb-2">Sistem Hatası</h2>
        <p className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest mb-4">
          Album Loading Failed
        </p>
        <p className="font-sans text-[11px] text-neutral-400 leading-relaxed mb-8">
          Bu albüm yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.
        </p>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => reset()}
          className="w-full py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tekrar Dene</span>
        </motion.button>
      </div>
    </main>
  );
}
