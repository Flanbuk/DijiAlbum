'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Compass, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const params = useParams();
  const eventId = params?.event_id;

  useEffect(() => {
    if (!eventId) {
      setError('Etkinlik anahtarı bulunamadı.');
      setLoading(false);
      return;
    }

    // UUID regex check to prevent DB cast errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      setError('Geçersiz seans anahtarı.');
      setLoading(false);
      return;
    }

    const checkEventStatus = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('events')
          .select('id, active')
          .eq('id', eventId)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (!data) {
          setError('Oturum bulunamadı veya geçersiz seans adresi.');
          setLoading(false);
          return;
        }

        if (data.active) {
          // Store event_id in localStorage so camera knows which event we are in
          localStorage.setItem('dijialbum_event_id', eventId);
          
          // Clear any stale guest records from other events so a new one is seeded for this session
          const savedEventId = localStorage.getItem('dijialbum_guest_event_id');
          if (savedEventId !== eventId) {
            localStorage.removeItem('dijialbum_guest_id');
            localStorage.removeItem('dijialbum_guest_event_id');
            localStorage.setItem('dijialbum_remaining_shots', '12');
            localStorage.removeItem('dijialbum_captured_photos');
          }
          
          // Redirect to camera viewfinder
          router.replace('/camera');
        } else {
          // Redirect to the public reveal gallery
          router.replace(`/reveal/${eventId}`);
        }
      } catch (err) {
        console.error('Yönlendirme hatası:', err);
        setError('Bağlantı zayıf veya sunucuda hata oluştu.');
        setLoading(false);
      }
    };

    checkEventStatus();
  }, [eventId, router]);

  return (
    <main className="relative flex flex-col items-center justify-center w-full min-h-screen bg-[#0A0A0A] px-4 py-8 select-none text-neutral-100 font-sans">
      {/* Moving Grain Background */}
      <div className="grain-overlay" />

      {loading ? (
        <div className="z-20 flex flex-col items-center justify-center text-center">
          <Compass className="w-10 h-10 text-neutral-600 animate-spin-slow mb-3" />
          <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
            Sensor link establishing...
          </div>
        </div>
      ) : (
        <div className="z-20 w-full max-w-sm bg-[#121212] border border-neutral-900 rounded-[24px] p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-inner animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-medium text-neutral-200 mb-2">
            Katılım Başarısız
          </h2>
          <p className="font-mono text-[10px] text-neutral-500 leading-relaxed mb-8 max-w-[240px]">
            {error || 'Geçersiz etkinlik bağlantısı.'}
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="w-full py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-colors cursor-pointer"
          >
            Ana Sayfaya Dön
          </motion.button>
        </div>
      )}
    </main>
  );
}
