'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Users, 
  Share2, 
  Download, 
  Check, 
  AlertTriangle, 
  Film, 
  Lock 
} from 'lucide-react';
import JSZip from 'jszip';

export default function AlbumPage() {
  const params = useParams();
  const eventId = params?.id;

  // States
  const [eventData, setEventData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [guestsCount, setGuestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  // Action States
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  useEffect(() => {
    if (!eventId) return;

    // Load initial metadata and photos
    const fetchAlbumData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Event details
        const { data: event, error: eventErr } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventErr) throw eventErr;
        setEventData(event);

        // 2. Fetch Photos and join Guest details
        const { data: photosData, error: photosErr } = await supabase
          .from('photos')
          .select('id, image_url, filter_used, created_at, guests(guest_name)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (photosErr) throw photosErr;
        setPhotos(photosData || []);

        // 3. Fetch count of registered Guests
        const { count, error: guestsErr } = await supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId);

        if (!guestsErr) {
          setGuestsCount(count || 0);
        }
      } catch (err) {
        console.error('Albüm verileri yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();

    // 4. Setup Real-time listener for incoming photos
    const channel = supabase
      .channel(`album-photos-stream-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Fetch guest name to display correctly in Polaroid card
          const { data: guestData } = await supabase
            .from('guests')
            .select('guest_name')
            .eq('id', payload.new.guest_id)
            .single();

          const newPhoto = {
            ...payload.new,
            guests: {
              guest_name: guestData?.guest_name || 'Misafir'
            }
          };

          setPhotos(prev => [newPhoto, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Bulk download as ZIP archive helper
  const downloadAllAsZip = async () => {
    if (photos.length === 0 || downloadingZip) return;
    
    setDownloadingZip(true);
    setZipProgress('Hazırlanıyor...');
    const zip = new JSZip();

    try {
      const promises = photos.map(async (photo, index) => {
        setZipProgress(`Sıkıştırılıyor... (${index + 1}/${photos.length})`);
        
        // Fetch original image data
        const response = await fetch(photo.image_url);
        const blob = await response.blob();
        
        // Establish unique filename for compression
        const extension = 'jpg';
        const dateKey = new Date(photo.created_at).getTime();
        const filename = `dijialbum-${photo.guests?.guest_name || 'guest'}-${dateKey}.${extension}`;
        
        zip.file(filename, blob);
      });

      await Promise.all(promises);
      
      setZipProgress('Arşiv Paketleniyor...');
      const archiveBlob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(archiveBlob);
      link.download = `dijialbum-${eventData?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'album'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Tüm fotoğraflar indirilirken bir bağlantı hatası oluştu.');
    } finally {
      setDownloadingZip(false);
      setZipProgress('');
    }
  };

  // Single photo download trigger
  const downloadSinglePhoto = async (url, guestName, createdAt) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `dijialbum-${guestName || 'photo'}-${new Date(createdAt).getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Share URL copy link
  const handleShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative flex flex-col items-center justify-start w-full min-h-screen bg-[#0A0A0A] px-4 py-8 select-none text-neutral-100 font-sans">
      {/* Heavy Blurred Cover Image Background layer */}
      {eventData?.cover_image_url && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-15 filter blur-3xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${eventData.cover_image_url})` }}
        />
      )}

      {/* Film Noise overlay */}
      <div className="grain-overlay" />

      {/* Loş Safelight Kırmızı Yansıması */}
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.14),transparent_70%)] z-10" />

      {/* Share / Bulk Action Deck Fixed to Top-Right */}
      <div className="fixed top-6 right-6 z-30 flex items-center gap-2.5">
        {/* QR Share button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleShareLink}
          className="p-3 bg-[#121212]/90 border border-neutral-900 rounded-xl text-neutral-400 hover:text-white shadow-lg cursor-pointer backdrop-blur-md flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors"
          title="Albüm Linkini Paylaş"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Kopyalandı' : 'Paylaş'}</span>
        </motion.button>

        {/* ZIP Bulk download button */}
        {photos.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={downloadAllAsZip}
            disabled={downloadingZip}
            className="p-3 bg-neutral-100 text-neutral-950 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-white shadow-lg cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Tüm Albümü İndir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingZip ? zipProgress : 'Tümünü İndir'}</span>
          </motion.button>
        )}
      </div>

      {loading ? (
        /* LOADING STATE DISPLAY */
        <div className="z-20 flex-1 flex flex-col items-center justify-center my-auto py-24">
          <Film className="w-10 h-10 text-neutral-700 animate-pulse mb-3" />
          <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
            Developed roll index loading...
          </div>
        </div>
      ) : !eventData ? (
        /* FAILURE DISMISS SCREEN */
        <div className="z-20 flex-1 flex flex-col items-center justify-center my-auto text-center py-24">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
          <h2 className="font-serif text-xl font-medium text-neutral-200 mb-2">Albüm Bulunamadı</h2>
          <p className="font-mono text-[10px] text-neutral-500 max-w-xs">
            Bağlantı adresi geçersiz veya bu etkinlik albümü sistemden kaldırılmış olabilir.
          </p>
        </div>
      ) : (
        /* STANDALONE CONTENT VIEW */
        <div className="z-20 w-full max-w-4xl flex flex-col gap-8 pb-32">
          
          {/* Magazine Cover styled Header hero details */}
          <header className="w-full flex flex-col items-center text-center mt-12 pb-6 border-b border-neutral-900/60">
            <h1 className="font-serif text-4xl sm:text-5xl italic tracking-tight leading-none text-neutral-100 uppercase drop-shadow-md max-w-2xl">
              {eventData.name}
            </h1>
            
            {/* Meta Information indicators */}
            <div className="font-mono text-[9px] text-neutral-500 tracking-[0.2em] uppercase mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-neutral-600" />
                <span>{photos.length} Moments</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-600" />
                <span>{guestsCount} People</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${eventData.active ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                <span className={eventData.active ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  {eventData.active ? 'Canlı Akış' : 'Developed / Banyo Edildi'}
                </span>
              </div>
            </div>
          </header>

          {photos.length === 0 ? (
            /* EMPTY MOMENTS PANEL */
            <div className="flex flex-col items-center justify-center text-center py-20 bg-neutral-950/40 border border-neutral-900/60 rounded-[32px] max-w-md mx-auto w-full shadow-inner">
              <Film className="w-8 h-8 text-neutral-600 mb-3 animate-pulse" />
              <h3 className="font-serif text-base text-neutral-400">Rulo Henüz Boş</h3>
              <p className="font-mono text-[9px] text-neutral-600 max-w-[200px] mt-1 uppercase tracking-wider leading-relaxed">
                Bu albüme henüz fotoğraf yüklenmedi. Kamerayı kullanarak ilk anıyı yakalayın!
              </p>
            </div>
          ) : (
            /* ASYMMETRIC MASONRY POLAROID LIST */
            <div className="columns-2 md:columns-3 gap-6 w-full break-inside-avoid">
              <AnimatePresence mode="popLayout">
                {photos.map((photo, index) => {
                  const rotationAngle = index % 2 === 0 ? 1 : -1;
                  return (
                    <motion.div
                      key={photo.id}
                      layoutId={`polaroid-container-${photo.id}`}
                      initial={{ opacity: 0, scale: 0.92, y: 15, rotate: rotationAngle }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: rotationAngle }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      onClick={() => setActivePhoto(photo)}
                      className="inline-block w-full bg-[#F5F5F5] p-3 pb-8 shadow-xl border border-neutral-200/20 rounded-xs select-none hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-zoom-in mb-6 relative group transform-gpu scroll-gpu"
                    >
                      {/* Filtered Photo Image */}
                      <div className="relative overflow-hidden w-full aspect-square bg-neutral-900 border border-neutral-300/40">
                        <img
                          src={photo.image_url}
                          alt={`Photo by ${photo.guests?.guest_name || 'Guest'}`}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          loading="lazy"
                        />
                      </div>

                      {/* Polaroid Footer Text Details */}
                      <div className="w-full mt-3.5 flex items-center justify-between px-0.5">
                        <span className="font-serif text-[11px] italic text-neutral-800 tracking-wide truncate pr-2 max-w-[120px]">
                          * {photo.guests?.guest_name || 'Misafir'} *
                        </span>
                        
                        {photo.filter_used && (
                          <span className="font-mono text-[7.5px] font-bold text-neutral-400 bg-neutral-900/5 border border-neutral-900/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {photo.filter_used}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}

      {/* FULL EXPAND LIGHTBOX MODAL */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              layoutId={`polaroid-container-${activePhoto.id}`}
              className="bg-[#F5F5F5] p-4 pb-14 rounded-xs shadow-2xl max-w-sm w-full relative cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main Photo */}
              <div className="w-full aspect-square overflow-hidden bg-neutral-900 border border-neutral-300">
                <img
                  src={activePhoto.image_url}
                  alt="Expanded moment"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Lightbox details footer */}
              <div className="w-full mt-4 flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <span className="font-serif text-[13px] italic font-semibold text-neutral-800">
                    * {activePhoto.guests?.guest_name || 'Misafir'} *
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest mt-0.5">
                    {new Date(activePhoto.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                {/* Download specific image */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadSinglePhoto(
                    activePhoto.image_url, 
                    activePhoto.guests?.guest_name, 
                    activePhoto.created_at
                  )}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  İndir
                </motion.button>
              </div>

              {/* Close Button overlay */}
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-neutral-400 font-mono text-[9px] font-bold uppercase tracking-widest cursor-pointer hover:text-neutral-700 transition-colors"
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
