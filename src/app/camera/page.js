'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, Film, RefreshCw, Compass, Lock, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FILTER_MODES = [
  { id: 'normal', name: 'Normal', filter: 'none', label: 'N' },
  { id: 'yesilcam', name: 'Yeşilçam', filter: 'sepia(0.5) contrast(1.2) saturate(0.85)', label: 'Y' },
  { id: 'karanlik', name: 'Karanlık Oda', filter: 'grayscale(1) contrast(1.4)', label: 'K' },
  { id: 'polaroid', name: 'Polaroid', filter: 'contrast(0.9) saturate(0.7) brightness(1.1)', label: 'P' },
  { id: 'disko', name: "Disko 90'lar", filter: 'saturate(1.5) hue-rotate(-20deg) contrast(1.2)', label: 'D' },
  { id: 'gumus', name: 'Gümüş Vizör', filter: 'saturate(0.4) sepia(0.2) hue-rotate(180deg)', label: 'G' },
  { id: 'altin', name: 'Altın Saat', filter: 'sepia(0.4) saturate(1.4) brightness(1.1) contrast(1.1)', label: 'A' }
];

const ZOOM_OPTIONS = [
  { label: '0.5x', value: 1.0 },
  { label: '1.2x', value: 1.2 }
];

const FilterSelector = memo(({ currentFilterIndex, onSelectFilter }) => {
  return (
    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-black/60 border border-neutral-800/50 py-3 px-1.5 rounded-full backdrop-blur-xs shadow-lg transform-gpu scroll-gpu">
      {FILTER_MODES.map((mode, index) => {
        const isActive = currentFilterIndex === index;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectFilter(index)}
            title={mode.name}
            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold relative cursor-pointer transform-gpu premium-transition ${
              isActive
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110 font-black'
                : 'bg-neutral-900/80 text-neutral-500 hover:text-neutral-300 border border-neutral-800'
            }`}
          >
            {mode.label}
            {isActive && (
              <span className="absolute -left-1 w-0.5 h-1.5 bg-amber-500 rounded-r-xs" />
            )}
          </button>
        );
      })}
    </div>
  );
});
FilterSelector.displayName = 'FilterSelector';

export default function CameraPage() {
  // Camera States
  const [hasPermission, setHasPermission] = useState(null);
  const [stream, setStream] = useState(null);
  const [shutterCount, setShutterCount] = useState(12);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Hardware States
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.0);

  // Capture States
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);
  const [activeToast, setActiveToast] = useState('');
  const toastTimeoutRef = useRef(null);
  const [uploadError, setUploadError] = useState('');

  // Dynamic Session States
  const [activeEventId, setActiveEventId] = useState('00000000-0000-0000-0000-000000000000');
  const [activeGuestId, setActiveGuestId] = useState(null);
  const [eventName, setEventName] = useState("Mehmet & Ayşe'nin Düğünü");
  const [guestName, setGuestName] = useState('Misafir');
  const [coverImageUrl, setCoverImageUrl] = useState(null);

  // Guest Onboarding States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Gallery Drawer States
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  // Gyroscope & Orientation States
  const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 });
  const [isOptimumAngle, setIsOptimumAngle] = useState(false);
  const [vibrated, setVibrated] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(null);
  const [iOSPermissionRequired, setIOSPermissionRequired] = useState(false);
  const [hasSensorPermission, setHasSensorPermission] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const videoRef = useRef(null);
  const viewfinderRef = useRef(null);

  // Detect active admin auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Load remaining shots, photos, event, and guest details
  useEffect(() => {
    const loadSessionAndData = async () => {
      let eventId = '00000000-0000-0000-0000-000000000000';
      
      if (typeof window !== 'undefined') {
        const savedEventId = localStorage.getItem('dijialbum_event_id');
        if (savedEventId) {
          eventId = savedEventId;
        }
        setActiveEventId(eventId);

        // Fetch Event details to display correct name and cover image
        if (eventId !== '00000000-0000-0000-0000-000000000000') {
          try {
            const { data } = await supabase.from('events').select('name, cover_image_url').eq('id', eventId).single();
            if (data?.name) setEventName(data.name);
            if (data?.cover_image_url) setCoverImageUrl(data.cover_image_url);
          } catch (e) {
            console.error('Event fetch error:', e);
          }
        }

        // Seeding Fallback Mock if root session
        if (eventId === '00000000-0000-0000-0000-000000000000') {
          await ensureMockData();
        }

        // Establish dynamic Guest ID
        let guestId = localStorage.getItem('dijialbum_guest_id');
        let savedName = localStorage.getItem('dijialbum_guest_name');
        
        if (savedName && guestId) {
          setGuestName(savedName);
          setActiveGuestId(guestId);
          initCamera(isFrontCamera);
        } else {
          // No guest registered yet - trigger onboarding modal first
          setShowOnboarding(true);
        }

        // Load shots count
        const savedShots = localStorage.getItem('dijialbum_remaining_shots');
        if (savedShots !== null) {
          setShutterCount(parseInt(savedShots, 10));
        } else if (guestId) {
          // Sync remaining shots from DB
          try {
            const { data } = await supabase.from('guests').select('remaining_shots').eq('id', guestId).single();
            if (data) {
              setShutterCount(data.remaining_shots);
              localStorage.setItem('dijialbum_remaining_shots', data.remaining_shots.toString());
            }
          } catch (e) {}
        }

        const savedPhotos = localStorage.getItem('dijialbum_captured_photos');
        if (savedPhotos !== null) {
          try {
            setCapturedPhotos(JSON.parse(savedPhotos));
          } catch (e) {}
        }
      }
    };

    loadSessionAndData();

    // Orientation sensor setup
    const iosCheck = 
      typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function';
    
    if (iosCheck) {
      setIOSPermissionRequired(true);
      setGyroSupported(true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      
      const gyroTimeout = setTimeout(() => {
        setGyroSupported(prev => {
          if (prev === null) {
            return false;
          }
          return prev;
        });
      }, 1500);

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        clearTimeout(gyroTimeout);
      };
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Save photos to local storage when capturing
  useEffect(() => {
    if (capturedPhotos.length > 0) {
      localStorage.setItem('dijialbum_captured_photos', JSON.stringify(capturedPhotos));
    }
  }, [capturedPhotos]);

  // Seeding fallback mock
  const ensureMockData = async () => {
    try {
      const mockId = '00000000-0000-0000-0000-000000000000';
      const { data: event } = await supabase.from('events').select('id').eq('id', mockId).maybeSingle();
      if (!event) {
        await supabase.from('events').insert({ id: mockId, name: "Ahmet & Buse's Wedding", active: true });
      }
      const { data: guest } = await supabase.from('guests').select('id').eq('id', mockId).maybeSingle();
      if (!guest) {
        await supabase.from('guests').insert({ id: mockId, event_id: mockId, guest_name: 'Mock Guest', remaining_shots: 12 });
      }
    } catch (e) {}
  };

  // Initialize Camera (with dynamic facing mode support and blink reset)
  const initCamera = async (frontCameraFlag) => {
    setHasPermission(null);
    setErrorMessage('');
    setIsReady(false); // Trigger visual blink transition
    setIsTorchOn(false); // Reset torch state when switching stream
    setIsTorchSupported(false); // Reset torch support
    setCurrentZoom(1.0); // Reset zoom level

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: frontCameraFlag ? 'user' : 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1440 },
          aspectRatio: { ideal: 0.75 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      setHasPermission(true);

      // Check track torch capabilities safely
      try {
        const track = mediaStream.getVideoTracks()[0];
        if (track) {
          const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
          setIsTorchSupported(!!capabilities.torch);
        }
      } catch (e) {
        console.warn('Could not read track capabilities:', e);
      }
    } catch (err) {
      console.error('Kamera başlatılamadı:', err);
      // Fallback to any camera if environment stream fails
      if (!frontCameraFlag) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          setStream(fallbackStream);
          setHasPermission(true);

          try {
            const track = fallbackStream.getVideoTracks()[0];
            if (track) {
              const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
              setIsTorchSupported(!!capabilities.torch);
            }
          } catch (e) {
            console.warn('Could not read fallback track capabilities:', e);
          }
          return;
        } catch (e) {}
      }

      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
      } else {
        setErrorMessage('Kamera cihazı bulunamadı veya başka bir uygulama tarafından kullanılıyor.');
      }
    }
  };

  // Onboarding screen form submit handler
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setOnboardingLoading(true);
    try {
      // Create a new guest for this event in database
      const { data, error } = await supabase
        .from('guests')
        .insert({
          event_id: activeEventId,
          guest_name: nameInput.trim(),
          remaining_shots: 12
        })
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem('dijialbum_guest_id', data.id);
        localStorage.setItem('dijialbum_guest_name', data.guest_name);
        localStorage.setItem('dijialbum_guest_event_id', activeEventId);
        localStorage.setItem('dijialbum_remaining_shots', '12');

        setActiveGuestId(data.id);
        setGuestName(data.guest_name);
        setShutterCount(12);
        
        // Hide onboarding modal and start video feed stream
        setShowOnboarding(false);
        initCamera(isFrontCamera);
      } else {
        throw error;
      }
    } catch (err) {
      console.error('Guest onboarding failed:', err);
      setUploadError('Giriş yapılamadı, lütfen tekrar deneyin.');
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Device Orientation Handler
  const handleOrientation = (event) => {
    if (event.beta !== null && event.gamma !== null) {
      setGyroSupported(true);
      const beta = Math.round(event.beta);
      const gamma = Math.round(event.gamma);
      setOrientation({ beta, gamma });
      setIsSimulating(false);
    } else {
      setGyroSupported(false);
    }
  };

  // Request iOS Sensor Permissions
  const requestSensorPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setHasSensorPermission(true);
          setIOSPermissionRequired(false);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setHasSensorPermission(false);
          setGyroSupported(false);
        }
      } catch (err) {
        console.error('Sensör izni alınamadı:', err);
        setHasSensorPermission(false);
        setGyroSupported(false);
      }
    }
  };

  // Angle Evaluation
  useEffect(() => {
    const { beta, gamma } = orientation;
    const isOptimum = beta >= 75 && beta <= 95 && gamma >= -10 && gamma <= 10;
    setIsOptimumAngle(isOptimum);

    if (isOptimum) {
      if (!vibrated) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setVibrated(true);
      }
    } else {
      setVibrated(false);
    }
  }, [orientation, vibrated]);

  // Desktop Mouse Movement Simulator Fallback
  const handleMouseMove = (e) => {
    if (gyroSupported === false || isSimulating) {
      setIsSimulating(true);
      if (!viewfinderRef.current) return;
      
      const rect = viewfinderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      const y = e.clientY - rect.top;  

      const relativeX = x / rect.width; 
      const gamma = Math.round((relativeX - 0.5) * 60);

      const relativeY = y / rect.height; 
      const beta = Math.round(90 - (relativeY - 0.5) * 50); 

      setOrientation({ beta, gamma });
    }
  };

  const handleMouseLeave = () => {
    if (isSimulating) {
      setOrientation({ beta: 0, gamma: 0 });
    }
  };

  // Mechanical Click Sound (Dial Switch)
  const playClickSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.015);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.015);
    } catch (e) {
      console.warn('Click synthesis failed:', e);
    }
  }, []);

  // Deep Analog Mirror Shutter Sound
  const playShutterSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      // Shutter blade sound (high frequency noise)
      const bufferSize = audioCtx.sampleRate * 0.15;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
      noiseFilter.Q.setValueAtTime(3.5, audioCtx.currentTime);
      
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start();

      // Mirror slap low frequency thump
      const thump = audioCtx.createOscillator();
      const thumpGain = audioCtx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(110, audioCtx.currentTime);
      thump.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.14);
      
      thumpGain.gain.setValueAtTime(0.32, audioCtx.currentTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
      
      thump.connect(thumpGain);
      thumpGain.connect(audioCtx.destination);
      thump.start();
      thump.stop(audioCtx.currentTime + 0.14);

    } catch (e) {
      console.warn('Shutter synthesis failed:', e);
    }
  }, []);

  // Hardware Torch Flash Controller
  const toggleTorch = useCallback(async () => {
    if (!isTorchSupported) {
      setUploadError('Bu kamerada flaş desteklenmiyor');
      setTimeout(() => {
        setUploadError('');
      }, 3000);
      return;
    }

    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      let capabilities = {};
      try {
        capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
      } catch (e) {
        console.warn('Could not read capabilities:', e);
      }

      if (capabilities.torch) {
        const nextTorchState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorchState }]
        });
        setIsTorchOn(nextTorchState);
      } else {
        // Torch capability unsupported (e.g. front camera, desktop fallback)
        setUploadError('Bu kamerada flaş desteklenmiyor');
        setTimeout(() => {
          setUploadError('');
        }, 3000);
      }
    } catch (err) {
      console.error('Flaş değiştirilemedi:', err);
      setUploadError('Flaş kontrolü bu cihazda başarısız oldu.');
      setTimeout(() => {
        setUploadError('');
      }, 3000);
    }
  }, [stream, isTorchOn, isTorchSupported]);

  // Hardware Zoom (Focus) Controller (0.5x - 1.2x)
  const changeZoom = useCallback(async (zoomVal) => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    playClickSound();

    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.zoom) {
        const min = capabilities.zoom.min || 1;
        const max = capabilities.zoom.max || 4;
        const clampedZoom = Math.min(Math.max(zoomVal, min), max);
        
        await track.applyConstraints({
          advanced: [{ zoom: clampedZoom }]
        });
        setCurrentZoom(zoomVal);
      } else {
        // Zoom unsupported
        setUploadError('Bu kamerada donanımsal odaklama desteklenmiyor');
        setTimeout(() => {
          setUploadError('');
        }, 3000);
      }
    } catch (err) {
      console.error('Odak ayarlanamadı:', err);
      setUploadError('Odak ayarı başarısız oldu.');
      setTimeout(() => {
        setUploadError('');
      }, 3000);
    }
  }, [stream, playClickSound]);

  // Camera Face Toggle
  const toggleCameraFacing = useCallback(() => {
    const nextFacing = !isFrontCamera;
    setIsFrontCamera(nextFacing);
    initCamera(nextFacing);
  }, [isFrontCamera]);

  // Mode Selection Dial
  const selectFilter = useCallback((index) => {
    playClickSound();
    setCurrentFilterIndex(index);
    setActiveToast(FILTER_MODES[index].name);
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast('');
    }, 1200);
  }, [playClickSound]);

  // Base64 to Blob helper
  const base64ToBlob = useCallback((base64, mimeType = 'image/jpeg') => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }, []);

  // Dynamic Background Cloud Sync Upload
  const uploadPhotoInBackground = useCallback(async (base64Data, nextShots) => {
    try {
      const eventId = activeEventId;
      const guestId = activeGuestId || '00000000-0000-0000-0000-000000000000';

      const blob = base64ToBlob(base64Data, 'image/jpeg');
      
      const fileId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const filename = `${Date.now()}-${fileId}.jpg`;
      const filePath = `${eventId}/${filename}`;

      // Upload to storage bucket
      const { error: uploadErr } = await supabase.storage
        .from('raw_photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadErr) throw uploadErr;

      // Retrieve Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('raw_photos')
        .getPublicUrl(filePath);

      // Insert record
      const { error: insertErr } = await supabase
        .from('photos')
        .insert({
          guest_id: guestId,
          event_id: eventId,
          image_url: publicUrl,
          filter_used: FILTER_MODES[currentFilterIndex].name
        });

      if (insertErr) throw insertErr;

      // Update remaining shots count in DB
      const { error: updateErr } = await supabase
        .from('guests')
        .update({ remaining_shots: nextShots })
        .eq('id', guestId);

      if (updateErr) throw updateErr;

      console.log('Background upload completed successfully!');

    } catch (err) {
      console.error('Sessiz arka plan yüklemesi başarısız:', err);
      setUploadError('Bağlantı zayıf, fotoğraf cihazda bekliyor.');
      setTimeout(() => {
        setUploadError('');
      }, 4000);
    }
  }, [activeEventId, activeGuestId, currentFilterIndex, base64ToBlob]);

  // Photo Capture Trigger
  const handleShutterClick = useCallback(() => {
    if (shutterCount <= 0 || isFlashing || !isReady) return;

    playShutterSound();
    setIsFlashing(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }

    let capturedDataUrl = null;

    try {
      const video = videoRef.current;
      if (video) {
        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1440;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = FILTER_MODES[currentFilterIndex].filter;
          
          if (isFrontCamera) {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(video, 0, 0, width, height);

          if (isFrontCamera) {
            // Restore context transformations to prevent mirrored texts
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }

          // Clear filter to draw text overlays in native bright colors
          ctx.filter = 'none';

          // 1. Draw Guest Signature Watermark (Bottom Left Corner)
          const signatureStr = `* ${guestName} *`;
          const fontSize = Math.round(height * 0.032);
          ctx.font = `italic ${fontSize}px "Cormorant Garamond", Georgia, serif`;
          ctx.fillStyle = '#F5F5F5';

          // Glow shadow styling
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = height * 0.006;
          ctx.shadowOffsetX = height * 0.002;
          ctx.shadowOffsetY = height * 0.002;

          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(signatureStr, width * 0.05, height - (height * 0.05));

          // 2. Draw Date Stamp (Bottom Right Corner)
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const dateStr = `${day} ${month} ${year}`;

          ctx.font = `bold ${fontSize}px "Geist Mono", "Courier New", monospace`;
          ctx.fillStyle = '#FF9900';
          ctx.textAlign = 'right';
          ctx.fillText(dateStr, width - (width * 0.05), height - (height * 0.05));

          // Clean shadow states
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPhotos(prev => [...prev, capturedDataUrl]);
        }
      }
    } catch (err) {
      console.error('Görüntü yakalama hatası:', err);
    }

    const nextShots = shutterCount - 1;
    setShutterCount(nextShots);
    localStorage.setItem('dijialbum_remaining_shots', nextShots.toString());

    if (capturedDataUrl) {
      uploadPhotoInBackground(capturedDataUrl, nextShots);
    }

    setTimeout(() => {
      setIsFlashing(false);
    }, 500);
  }, [shutterCount, isFlashing, isReady, currentFilterIndex, guestName, uploadPhotoInBackground, playShutterSound]);

  const handleResetRoll = useCallback(() => {
    setShutterCount(12);
    setCapturedPhotos([]);
    localStorage.setItem('dijialbum_remaining_shots', '12');
    localStorage.removeItem('dijialbum_captured_photos');
    if (activeGuestId) {
      supabase.from('guests').update({ remaining_shots: 12 }).eq('id', activeGuestId).then();
    }
  }, [activeGuestId]);

  return (
    <main className="relative flex flex-col items-center justify-between w-full min-h-screen bg-[#0A0A0A] overflow-hidden select-none px-4 py-6 md:py-8">
      {/* Blurred Cover Image Backdrop Background */}
      {coverImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.14] filter blur-2xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${coverImageUrl})` }}
        />
      )}

      {/* Film Grain Background Overlay */}
      <div className="grain-overlay" />

      {/* Connection Failure Red Toast Alert */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 z-50 bg-red-950/90 border border-red-800 text-red-200 px-4 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-wider shadow-lg flex items-center gap-2 backdrop-blur-xs"
          >
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header with magazine editorial styling */}
      <header className="z-20 flex flex-col items-center justify-center w-full max-w-md pt-2 text-center border-b border-neutral-900/60 pb-3">
        <h1 className="font-serif text-3xl sm:text-4xl italic tracking-tight leading-none text-neutral-100 uppercase drop-shadow-md">
          {eventName}
        </h1>
        <div className="font-mono text-[8px] text-amber-500 tracking-[0.25em] uppercase mt-2 w-full flex justify-between px-2">
          <span>Session Active</span>
          <span>04h 22m remaining</span>
        </div>
      </header>

      {/* Viewfinder Section */}
      <section className="relative z-10 flex flex-col items-center justify-center w-full max-w-md my-auto">
        
        {/* Game Task Banner */}
        <div className="z-20 w-full bg-[#121212]/95 border border-neutral-900 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] mb-3">
          <span className={`font-serif text-[11px] tracking-wide transition-all duration-300 ${
            isOptimumAngle 
              ? 'text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]' 
              : 'text-neutral-400'
          }`}>
            {isOptimumAngle ? 'MÜKEMMEL AÇI! ŞİMDİ ÇEK!' : 'GÖREV: Telefonu tam dik açıda tut!'}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-900">
            <span className={isOptimumAngle ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
              B: {orientation.beta}°
            </span>
            <span className="text-neutral-700">|</span>
            <span className={isOptimumAngle ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
              G: {orientation.gamma}°
            </span>
          </div>
        </div>

        {/* Camera Frame Container */}
        <div 
          ref={viewfinderRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full aspect-[3/4] overflow-hidden border border-neutral-900 rounded-[28px] bg-black shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-crosshair group"
        >
          {/* Dynamic Viewfinder Frame Assistant */}
          <div className={`absolute inset-0 z-35 pointer-events-none border-[3.5px] rounded-[28px] transition-all duration-300 ${
            isOptimumAngle 
              ? 'neon-border-glow border-emerald-400' 
              : 'border-white/10'
          }`} />

          {/* Viewfinder Overlaid Crosshairs */}
          <div className="absolute inset-0 z-30 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Corners */}
            <div className="flex justify-between w-full">
              <div className="w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-xs" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-xs" />
            </div>
            {/* Center target cursor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none opacity-20">
              <div className="absolute w-5 h-[1px] bg-white" />
              <div className="absolute h-5 w-[1px] bg-white" />
              <div className="w-1.5 h-1.5 rounded-full border border-white" />
            </div>
            {/* Bottom Corners */}
            <div className="flex justify-between w-full">
              <div className="w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-xs" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-xs" />
            </div>
          </div>

          {/* LED Indicators */}
          <div className="absolute left-6 top-6 z-30 pointer-events-none font-mono text-[9px] text-emerald-500/80 font-semibold tracking-wider flex items-center gap-1.5 bg-black/45 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ISO 400
          </div>

          <div className="absolute right-6 top-6 z-30 pointer-events-none font-mono text-[9px] text-amber-500/80 font-semibold tracking-wider bg-black/45 px-2 py-0.5 rounded-md backdrop-blur-xs">
            ROLL 01
          </div>

          {/* Vertical Mode Selector Dial */}
          <FilterSelector currentFilterIndex={currentFilterIndex} onSelectFilter={selectFilter} />

          {/* Retro Filters Toast Overlay */}
          <AnimatePresence>
            {activeToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-40 bg-neutral-950/90 border border-neutral-800/80 px-4 py-2 rounded-xl font-serif text-[13px] text-neutral-100 tracking-wider shadow-xl backdrop-blur-xs"
              >
                {activeToast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Feed */}
          {hasPermission === true && (
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
              autoPlay
              playsInline
              muted
              style={{ 
                filter: FILTER_MODES[currentFilterIndex].filter,
                transform: isFrontCamera ? 'scaleX(-1)' : 'none'
              }}
              className="absolute inset-0 w-full h-full object-cover scale-[1.01] transition-all duration-300"
              onPlay={() => setIsReady(true)}
            />
          )}

          {/* Visual hardware blink transition overlay */}
          <AnimatePresence>
            {!isReady && hasPermission === true && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="absolute inset-0 z-35 bg-black"
              />
            )}
          </AnimatePresence>

          {/* Shutter flash layer */}
          <AnimatePresence>
            {isFlashing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 z-40 bg-white"
              />
            )}
          </AnimatePresence>

          {/* iOS Sensor Permission Request Modal Overlay */}
          {iOSPermissionRequired && (
            <div className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="font-serif text-base text-neutral-200 mb-1">Jiroskop Asistanı</h3>
              <p className="font-mono text-[10px] text-neutral-500 leading-relaxed max-w-[200px] mb-6">
                Mükemmel açıyı yakalamak için cihaz hareket sensörlerini aktifleştirin.
              </p>
              <button
                onClick={requestSensorPermission}
                className="px-5 py-2 bg-neutral-100 text-neutral-900 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Sensör İzni Ver
              </button>
            </div>
          )}

          {/* Desktop Simulator Visual Guide */}
          {!iOSPermissionRequired && gyroSupported === false && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none font-mono text-[8px] text-neutral-500 tracking-wider bg-black/60 px-3 py-1 rounded-md backdrop-blur-xs border border-neutral-900">
              Masaüstü Sim: Fareyi merkeze yaklaştırın.
            </div>
          )}

          {/* Camera Denied Permission Screen */}
          {hasPermission === false && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-neutral-950/95 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl font-medium text-neutral-200 mb-2">
                Kamera Erişimi Gerekli
              </h2>
              <p className="font-mono text-[11px] text-neutral-500 leading-relaxed max-w-[240px] mb-8">
                {errorMessage || 'Fotoğraf çekebilmek ve vizörü etkinleştirmek için kamera izni vermeniz gerekmektedir.'}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={initCamera}
                className="px-6 py-2.5 bg-neutral-100 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-colors cursor-pointer"
              >
                İzinleri Yenile
              </motion.button>
            </div>
          )}

          {/* Loading Camera Indicator */}
          {hasPermission === null && !showOnboarding && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950 text-center">
              <Camera className="w-10 h-10 text-neutral-600 animate-pulse mb-3" />
              <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
                Sensor Link init...
              </div>
            </div>
          )}
          
          {/* Out of film shots screen */}
          {hasPermission === true && shutterCount === 0 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-neutral-950/95 text-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                <Film className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-neutral-100 mb-3 tracking-wide">
                Fotoğraflarınız Tamamdır!
              </h2>
              <p className="font-sans text-[11px] text-neutral-400 leading-relaxed max-w-[260px] mb-8">
                {isAdmin 
                  ? "Bu etkinlik için ayrılan tüm kareleri başarıyla doldurdunuz. Albümün açılmasını ve anıların ortaya çıkmasını bekleyebilirsiniz."
                  : "Çektiğiniz harika kareler etkinlik sahibine iletildi. Albüm hazır olduğunda etkinlik sahibi sizinle paylaşacaktır."
                }
              </p>
              
              {isAdmin && (
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (activeEventId && activeEventId !== '00000000-0000-0000-0000-000000000000') {
                        window.location.href = `/album/${activeEventId}`;
                      } else {
                        window.location.href = '/';
                      }
                    }}
                    className="w-full py-3 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md transform-gpu"
                  >
                    Albüme Git 🖼️
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Control Panel Footer with Ergonomic Capsule placed right above shutter button deck */}
      <footer className="z-20 w-full max-w-md mt-auto pb-4 flex flex-col items-center gap-4">
        
        {/* Compact Yatay Ergonomic Control Capsule */}
        <div className="bg-black/60 border border-neutral-900 px-4 py-2 rounded-full flex items-center justify-between w-[220px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {/* Torch Light Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTorch}
            className={`p-1 rounded-lg transition-all cursor-pointer ${
              !isTorchSupported 
                ? 'text-neutral-700 opacity-55 hover:text-neutral-600' 
                : isTorchOn 
                  ? 'text-[#FF9900] drop-shadow-[0_0_6px_rgba(255,153,0,0.5)]' 
                  : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Flash Toggle"
          >
            <Zap className="w-4 h-4" />
          </motion.button>

          {/* Capsule Divider */}
          <div className="w-[1px] h-3.5 bg-neutral-800" />

          {/* Zoom Selector 0.5x / 1.2x */}
          <div className="flex items-center gap-1">
            {ZOOM_OPTIONS.map((opt) => {
              const isActive = currentZoom === opt.value;
              return (
                <motion.button
                  key={opt.label}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeZoom(opt.value)}
                  className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-md transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-black'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>

          {/* Capsule Divider */}
          <div className="w-[1px] h-3.5 bg-neutral-800" />

          {/* Flip Camera Orientation Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleCameraFacing}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            title="Flip Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Shutter deck items */}
        <div className="w-full flex items-center justify-between px-6">
          {/* Left Mechanical Shot Counter */}
          <div className="flex flex-col items-start gap-1 w-20">
            <span className="font-mono text-[9px] text-neutral-600 tracking-wider uppercase">
              FILM SHOTS
            </span>
            <div className="bg-[#121212] border border-neutral-900 px-3 py-1.5 rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] min-w-[70px]">
              <span className="font-mono text-lg font-bold text-amber-500 tracking-widest drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                {String(shutterCount).padStart(2, '0')} / 12
              </span>
            </div>
          </div>

          {/* Center Tactile Shutter Button */}
          <div className="flex items-center justify-center p-2 rounded-full border border-white/5 bg-[#121212]/50 backdrop-blur-xs">
            <motion.button
              whileTap={shutterCount > 0 ? { scale: 0.92, y: 1 } : { scale: 1 }}
              onClick={handleShutterClick}
              disabled={shutterCount === 0 || isFlashing || !isReady}
              className={`w-20 h-20 rounded-full flex items-center justify-center focus:outline-none transition-all ${
                shutterCount === 0
                  ? 'bg-neutral-950 border-neutral-900 text-neutral-800 cursor-not-allowed shadow-none border-2'
                  : !isReady
                  ? 'bg-neutral-800 border-neutral-700 cursor-not-allowed shadow-none border-2'
                  : 'bg-neutral-200 hover:bg-white border-2 border-neutral-300 shadow-[inset_0_4px_6px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.6),inset_0_-4px_6px_rgba(0,0,0,0.25)] active:shadow-[inset_0_6px_10px_rgba(0,0,0,0.4)] cursor-pointer'
              }`}
            >
              {/* Inner Metallic Circular Accents */}
              <div className={`absolute inset-2.5 rounded-full border ${
                shutterCount === 0 ? 'border-neutral-900' : !isReady ? 'border-neutral-700' : 'border-neutral-400/30'
              }`} />
            </motion.button>
          </div>

          {/* Right Film Roll Button with live preview of the last shot */}
          <div className="flex flex-col items-end gap-1 w-20">
            <span className="font-mono text-[9px] text-neutral-600 tracking-wider uppercase">
              ROLL IN
            </span>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsGalleryOpen(true)}
              className="w-12 h-12 rounded-full border border-neutral-900 bg-[#121212] flex items-center justify-center overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] hover:border-neutral-800 transition-all cursor-pointer group relative"
            >
              {capturedPhotos.length > 0 ? (
                <img 
                  src={capturedPhotos[capturedPhotos.length - 1]} 
                  alt="Captured film preview" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <Film className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              )}
            </motion.button>
          </div>
        </div>

      </footer>

      {/* Safelight Red Bottom Sheet Gallery Drawer Component */}
      <AnimatePresence>
        {isGalleryOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGalleryOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Bottom Sheet Gövde */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[85vh] rounded-t-[32px] bg-gradient-to-b from-[#160606]/98 via-[#0A0A0A]/99 to-[#0A0A0A] border-t border-red-950/40 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Safelight Red Loş Kırmızı Işık Yansıması */}
              <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.18),transparent_70%)] z-10" />

              {/* Drag Handle Top Bar */}
              <div 
                onClick={() => setIsGalleryOpen(false)}
                className="relative z-20 flex flex-col items-center justify-center w-full py-4 cursor-pointer group"
              >
                <div className="w-12 h-1 bg-neutral-800 group-hover:bg-neutral-600 rounded-full transition-colors" />
              </div>

              {/* Header Container */}
              <div className="relative z-20 px-6 pb-4 border-b border-neutral-900/60 flex flex-col items-center text-center">
                <h2 className="font-serif text-lg text-neutral-100 tracking-wide">
                  Senin Film Rulon
                </h2>
                <span className="font-mono text-[9px] text-amber-500 font-semibold tracking-widest uppercase mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {capturedPhotos.length} / 12 Mermi
                </span>
              </div>

              {/* Bento Grid Polaroid Slots */}
              <div className="relative z-20 flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-md mx-auto">
                  {Array.from({ length: 12 }).map((_, index) => {
                    const hasPhoto = index < capturedPhotos.length;
                    const photo = hasPhoto ? capturedPhotos[index] : null;

                    if (hasPhoto) {
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setActivePhotoUrl(photo)}
                          className="bg-[#F5F5F5] p-2.5 pb-7 shadow-xl border border-neutral-200/20 rounded-xs select-none hover:shadow-2xl hover:scale-102 transition-all cursor-zoom-in relative"
                          style={{
                            transform: `rotate(${(index % 2 === 0 ? 1.5 : -1.5)}deg)`
                          }}
                        >
                          <img
                            src={photo}
                            alt={`Film frame ${index + 1}`}
                            className="w-full aspect-square object-cover bg-neutral-900 border border-neutral-300/40"
                          />
                          <div className="absolute bottom-1 right-2.5 font-mono text-[8px] text-neutral-400">
                            #{String(index + 1).padStart(2, '0')}
                          </div>
                        </motion.div>
                      );
                    } else {
                      return (
                        <div
                          key={index}
                          className="aspect-square bg-neutral-950/80 border border-neutral-900/60 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] opacity-35"
                        >
                          <Lock className="w-4 h-4 text-neutral-600 stroke-[1.5px]" />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Close Drawer Footer Button */}
              <div className="relative z-20 p-6 border-t border-neutral-900/60 bg-[#0A0A0A] flex justify-center shadow-lg">
                <button
                  onClick={() => setIsGalleryOpen(false)}
                  className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-colors cursor-pointer"
                >
                  Kameraya Dön 📸
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                alt="Enlarged film frame"
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

      {/* Premium Guest Onboarding Welcome Screen Modal Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="w-full max-w-md bg-[#121212] border border-neutral-900 rounded-[28px] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center"
            >
              {/* Warm dark red safelight glow */}
              <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(153,27,27,0.12),transparent_70%)]" />

              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-inner relative z-10">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>

              <h2 className="font-serif text-2xl font-medium tracking-wide text-neutral-100 uppercase text-center mb-1 relative z-10">
                Anı Yakalamaya Hazır mısın?
              </h2>
              <p className="font-mono text-[9px] text-amber-500 tracking-widest uppercase mb-8 text-center relative z-10">
                {eventName}
              </p>

              <form onSubmit={handleOnboardingSubmit} className="w-full flex flex-col gap-5 relative z-10">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">İSİM SOYİSİM</label>
                  <input
                    type="text"
                    required
                    placeholder="Adınız ve Soyadınız"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-900 text-neutral-300 font-sans text-sm px-4 py-3 rounded-xl focus:border-amber-500/50 outline-none transition-colors shadow-inner"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={onboardingLoading}
                  className="w-full py-4 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-[0_6px_20px_rgba(255,255,255,0.06)] cursor-pointer transition-colors"
                >
                  {onboardingLoading ? 'Hazırlanıyor...' : 'Kamerayı Aç 📸'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
