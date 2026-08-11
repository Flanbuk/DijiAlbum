import { Film } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-[#0A0A0A] px-6 select-none text-neutral-100 font-sans overflow-hidden">
      {/* Subtle safelight red/amber glow background */}
      <div className="absolute top-0 inset-x-0 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.12),transparent_70%)]" />
      
      <div className="z-10 flex flex-col items-center max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800/80 flex items-center justify-center text-amber-500 mb-6 shadow-inner animate-pulse">
          <Film className="w-5 h-5" />
        </div>

        <h1 className="font-serif text-lg text-neutral-200 tracking-wide mb-3 uppercase">
          Erişim Kısıtlı
        </h1>

        <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
          Bu sisteme yalnızca etkinlik QR kodu ile giriş yapılabilir.
        </p>
      </div>
    </main>
  );
}
