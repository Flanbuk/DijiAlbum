'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Compass, Film, AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RevealPage({ params }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams?.event_id;

  const [photos, setPhotos] = useState([]);
  const [eventName, setEventName] = useState("DijiAlbum");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  const pageSize = 12;

  const fetchPhotos = async (pageNum = 0) => {
    if (!eventId) return;
    try {
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('photos')
        .select('image_url, filter_used, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (pageNum === 0) {
        setPhotos(data || []);
      } else {
        setPhotos(prev => [...prev, ...(data || [])]);
      }

      if (!data || data.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.error('Fotoğraflar çekilemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const loadInitialData = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('name')
          .eq('id', eventId)
          .single();
        
        if (data?.name) {
          setEventName(data.name);
        }
      } catch (e) {
        console.error(e);
      }

      await fetchPhotos(0);
    };

    loadInitialData();
  }, [eventId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPhotos(nextPage);
  };

  return (
    <main className="relative flex flex-col items-center justify-start w-full min-h-screen bg-[#0A0A0A] px-4 py-8 select-none text-neutral-100 font-sans">
      {/* Moving Grain Background */}
      <div className="grain-overlay" />

      {/* Safelight Red Darkroom Glow at the top */}
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.15),transparent_70%)] z-10" />

      {/* Header (No specific wedding names used in the main header as per instructions) */}
      <header className="z-20 w-full max-w-3xl text-center mb-10 pt-4 flex flex-col items-center">
        <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
          {eventName.toUpperCase()} • DEVELOPED ARCHIVE
        </span>
        <h1 className="font-serif text-3xl font-medium tracking-wide text-neutral-100 uppercase">
          Filmler Banyo Edildi.
        </h1>
        <div className="w-12 h-[1px] bg-red-950 mt-3" />
      </header>

      {loading && page === 0 ? (
        <div className="z-20 flex flex-col items-center justify-center my-auto">
          <Compass className="w-10 h-10 text-neutral-600 animate-spin-slow mb-3" />
          <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
            Developing film roll...
          </div>
        </div>
      ) : (
        <section className="z-20 w-full max-w-3xl flex flex-col items-center pb-12">
          {photos.length === 0 ? (
            <div className="bg-[#121212] border border-neutral-900 rounded-[24px] p-10 flex flex-col items-center text-center max-w-sm mt-8 shadow-2xl">
              <Film className="w-12 h-12 text-neutral-800 stroke-[1.5px] mb-4" />
              <h3 className="font-serif text-lg text-neutral-400 font-medium">Banyo Edilmiş Görüntü Yok</h3>
              <p className="font-mono text-[10px] text-neutral-500 mt-1 leading-relaxed">
                Bu seansa ait yüklenmiş herhangi bir fotoğraf bulunamadı.
              </p>
            </div>
          ) : (
            <>
              {/* CSS columns Masonry Grid layout */}
              <div className="columns-2 md:columns-3 gap-5 w-full">
                {photos.map((photo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    onClick={() => setActivePhotoUrl(photo.image_url)}
                    className="break-inside-avoid mb-5 bg-[#F5F5F5] p-3 pb-8 shadow-xl border border-neutral-200/20 rounded-xs select-none hover:shadow-2xl hover:scale-102 transition-all cursor-zoom-in relative group"
                    style={{
                      transform: `rotate(${(index % 2 === 0 ? 1 : -1)}deg)`
                    }}
                  >
                    <img
                      src={photo.image_url}
                      alt={`Developed frame ${index}`}
                      className="w-full h-auto object-cover bg-neutral-900 border border-neutral-300/40"
                      loading="lazy"
                    />
                    
                    {/* Retro developer tags */}
                    <div className="absolute bottom-2 left-3 font-mono text-[8px] text-neutral-400 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {photo.filter_used || 'Normal'}
                    </div>

                    <div className="absolute bottom-2 right-3 font-mono text-[8px] text-neutral-400">
                      #{String(photos.length - index).padStart(3, '0')}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="w-full flex justify-center mt-8">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoadMore}
                    className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-colors cursor-pointer"
                  >
                    Daha Fazla Fotoğraf Yükle
                  </motion.button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Lightbox Polaroid Image Modal Zoom */}
      <AnimatePresence>
        {activePhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhotoUrl(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#F5F5F5] p-4 pb-14 rounded-xs shadow-2xl max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhotoUrl}
                alt="Developed frame zoomed"
                className="w-full aspect-square object-cover bg-neutral-900 border border-neutral-300"
              />
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-neutral-500 font-mono text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-neutral-800 transition-colors"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
