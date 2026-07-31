'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  AlertTriangle, 
  Compass, 
  Copy, 
  Check, 
  Power, 
  Film, 
  Heart, 
  Sparkles, 
  Users, 
  PartyPopper,
  Flame,
  Palmtree,
  Music,
  Scissors,
  Lock,
  LogOut,
  Mail,
  Phone,
  ExternalLink,
  CreditCard
} from 'lucide-react';

const EVENT_TYPES = [
  { id: 'dugun', name: 'Düğün', icon: Heart },
  { id: 'kina', name: 'Kına', icon: PartyPopper },
  { id: 'dogumgunu', name: 'Doğum Günü', icon: Sparkles },
  { id: 'sunnet', name: 'Sünnet', icon: Scissors },
  { id: 'date', name: 'Date', icon: Flame },
  { id: 'tatil', name: 'Tatil', icon: Palmtree },
  { id: 'parti', name: 'Parti', icon: Music }
];

export default function AdminPage() {
  // Auth States
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('email'); // Default main method is 'email'
  const [emailMode, setEmailMode] = useState('signin'); // 'signin' | 'signup'
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Panel States
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Multi-step Checkout States
  const [activeStep, setActiveStep] = useState('dashboard'); // 'dashboard' | 'pricing' | 'checkout' | 'success'
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Event Config Form States
  const [eventNameInput, setEventNameInput] = useState('');
  const [selectedType, setSelectedType] = useState('dugun');
  const [sessionError, setSessionError] = useState('');

  // Pricing Matrix Config (Concept type maps directly to price/limits)
  const getPackageDetails = (typeId) => {
    switch (typeId) {
      case 'dugun':
      case 'kina':
      case 'sunnet':
        return {
          packageName: 'Premium Mega Paket',
          price: 500,
          maxGuests: 9999,
          duration: '7 Gün',
          features: ['Sınırsız Katılımcı Limiti', '7 Gün Aktiflik Süresi', 'Öncelikli Real-time Akış Hızı']
        };
      case 'dogumgunu':
        return {
          packageName: 'Standart Paket',
          price: 250,
          maxGuests: 150,
          duration: '3 Gün',
          features: ['150 Katılımcı Limiti', '3 Gün Aktiflik Süresi', 'Standart Real-time Akış Hızı']
        };
      case 'parti':
        return {
          packageName: 'Parti Paketi',
          price: 200,
          maxGuests: 100,
          duration: '2 Gün',
          features: ['100 Katılımcı Limiti', '2 Gün Aktiflik Süresi', 'Standart Real-time Akış Hızı']
        };
      case 'tatil':
        return {
          packageName: 'Tatil Paketi',
          price: 200,
          maxGuests: 100,
          duration: '5 Gün',
          features: ['100 Katılımcı Limiti', '5 Gün Aktiflik Süresi', 'Standart Real-time Akış Hızı']
        };
      case 'date':
        return {
          packageName: 'Mini Paket',
          price: 120,
          maxGuests: 10,
          duration: '24 Saat',
          features: ['10 Katılımcı Limiti', '24 Saat Aktiflik Süresi', 'Standart Real-time Akış Hızı']
        };
      default:
        return {
          packageName: 'Standart Paket',
          price: 250,
          maxGuests: 50,
          duration: '24 Saat',
          features: ['50 Katılımcı Limiti', '24 Saat Aktiflik']
        };
    }
  };

  const handleCopyAlbumLink = (eventId) => {
    if (typeof window === 'undefined') return;
    const albumUrl = `${window.location.origin}/album/${eventId}`;
    navigator.clipboard.writeText(albumUrl);
    setToastMessage('Albüm linki kopyalandı!');
    setTimeout(() => setToastMessage(''), 2000);
  };

  // Auth Error Translator
  const translateAuthError = (message) => {
    if (!message) return '';
    const msg = message.toLowerCase();
    
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('login details')) {
      return 'Giriş bilgileri geçersiz. Lütfen e-posta ve şifrenizi kontrol edin.';
    }
    if (msg.includes('user already registered') || msg.includes('email already in use') || msg.includes('already exists')) {
      return 'Bu e-posta adresiyle zaten bir kullanıcı kayıtlı.';
    }
    if (msg.includes('email confirmation') || msg.includes('confirmation required') || msg.includes('check your email') || msg.includes('verify your email')) {
      return 'E-postanıza doğrulama bağlantısı gönderildi, lütfen kontrol edin.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Çok fazla deneme yapıldı. Lütfen bir süre bekleyip tekrar deneyin.';
    }
    if (msg.includes('provider is not enabled') || msg.includes('disabled provider') || msg.includes('not configured')) {
      return 'Google/Telefon ile giriş henüz kurulmadı, lütfen E-mail ile giriş yapın.';
    }
    return message;
  };

  // Auth State Listener (Persistence & State Sync)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch events when user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // Fetch all events (Isolated by user_id)
  const fetchEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEventsList(data || []);
      const active = data?.find(e => e.active);
      setActiveEvent(active || null);
    } catch (err) {
      console.error('Etkinlikler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Auth trigger
  const handleGoogleAuth = async () => {
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : ''
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setAuthError('Google/Telefon ile giriş henüz kurulmadı, lütfen E-mail ile giriş yapın.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Email login/signup trigger
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);

    if (!email || !password) {
      setAuthError('E-posta ve şifre alanlarını doldurun.');
      setAuthLoading(false);
      return;
    }

    try {
      if (emailMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data?.user && !data?.session) {
          setSuccessMessage('E-postanıza doğrulama bağlantısı gönderildi, lütfen kontrol edin.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user && !data?.session) {
          setSuccessMessage('E-postanıza doğrulama bağlantısı gönderildi, lütfen kontrol edin.');
        } else {
          setSuccessMessage('Kayıt başarılı! Giriş yapabilirsiniz.');
          setEmailMode('signin');
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError(translateAuthError(err.message));
    } finally {
      setAuthLoading(false);
    }
  };

  // Phone OTP code request trigger
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);

    if (!phoneNumber) {
      setAuthError('Telefon numarasını girin.');
      setAuthLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) throw error;
      setIsCodeSent(true);
      setSuccessMessage('SMS onay kodu telefonunuza gönderildi.');
    } catch (err) {
      console.error(err);
      setAuthError('Google/Telefon ile giriş henüz kurulmadı, lütfen E-mail ile giriş yapın.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify Phone OTP trigger
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setAuthLoading(true);

    if (!verificationCode) {
      setAuthError('Onay kodunu girin.');
      setAuthLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: 'sms'
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setAuthError(translateAuthError(err.message));
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out user (purging state and localStorage)
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    setEventsList([]);
    setActiveEvent(null);
    setActiveStep('dashboard');
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  };

  // Bypassed event creation (MVP/Direct creation)
  const handleDirectCreateEvent = async (e) => {
    e.preventDefault();
    setSessionError('');

    if (!eventNameInput.trim()) {
      setSessionError('Lütfen etkinlik ismini girin.');
      return;
    }

    if (!user) {
      setSessionError('Oturum başlatılamadı: Kullanıcı bilgisi eksik.');
      return;
    }

    setPaymentProcessing(true);

    try {
      const pkg = getPackageDetails(selectedType);
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          name: eventNameInput.trim(),
          event_type: selectedType,
          max_guests: pkg.maxGuests,
          price: null, // Price is null for bypassed flow
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setActiveEvent(data);
      setEventNameInput('');
      setActiveStep('dashboard');
      fetchEvents();
    } catch (err) {
      console.error('Doğrudan seans oluşturulamadı:', err);
      setSessionError('Seans oluşturulamadı. Lütfen veritabanı bağlantınızı kontrol edin.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Complete payment and automatically create session on Supabase (using price matrix mapping)
  const handleCompletePayment = async (e) => {
    e.preventDefault();
    setSessionError('');

    if (!eventNameInput.trim()) {
      setSessionError('Lütfen etkinlik ismini girin.');
      setActiveStep('pricing');
      return;
    }
    
    if (!cardHolder || !cardNumber || !cardExpiry || !cardCvc) {
      setSessionError('Lütfen tüm kart alanlarını doldurun.');
      return;
    }
    
    if (!user) {
      setSessionError('Oturum başlatılamadı: Kullanıcı bilgisi eksik.');
      return;
    }

    setPaymentProcessing(true);

    // Simulate payment transaction
    setTimeout(async () => {
      try {
        const pkg = getPackageDetails(selectedType);
        const { data, error } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            name: eventNameInput.trim(),
            event_type: selectedType,
            max_guests: pkg.maxGuests,
            price: pkg.price, // Save mapped price
            active: true
          })
          .select()
          .single();

        if (error) throw error;

        // Switch to successful checkmark trigger
        setActiveStep('success');

        setTimeout(() => {
          setActiveEvent(data);
          setEventNameInput('');
          setCardHolder('');
          setCardNumber('');
          setCardExpiry('');
          setCardCvc('');
          setActiveStep('dashboard');
          fetchEvents();
        }, 1800);

      } catch (err) {
        console.error('Ödeme sonrası seans oluşturulamadı:', err);
        setSessionError('Ödeme alındı fakat seans oluşturulamadı. Lütfen veritabanı bağlantınızı kontrol edin.');
      } finally {
        setPaymentProcessing(false);
      }
    }, 1500);
  };

  // Close/Finish current active session (banyo et)
  const handleFinishSession = async () => {
    if (!activeEvent) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ active: false })
        .eq('id', activeEvent.id);

      if (error) throw error;

      setActiveEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Oturum bitirilemedi:', err);
    }
  };

  const getInviteUrl = () => {
    if (!activeEvent) return '';
    return `${window.location.origin}/join/${activeEvent.id}`;
  };

  const getQrCodeUrl = () => {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=255-255-255&bgcolor=10-10-10&data=${encodeURIComponent(inviteUrl)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getInviteUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatUserDisplayName = () => {
    if (!user) return '';
    return user.email || user.phone || 'Yönetici';
  };

  // Autofill test credentials helper
  const handleAutofillTestCard = () => {
    setCardHolder('Test Admin');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/29');
    setCardCvc('123');
  };

  // Card Number Format (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const matches = val.match(/.{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    setCardNumber(formatted.substring(0, 19));
  };

  // Expiry Date Format (MM/YY)
  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val.substring(0, 5));
  };

  // CVC Format (XXX digits only)
  const handleCardCvcChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCardCvc(val.substring(0, 3));
  };

  // Inferred package details based on event type selection
  const pkgDetails = getPackageDetails(selectedType);

  return (
    <main className="relative flex flex-col items-center justify-start w-full min-h-screen bg-[#0A0A0A] px-4 py-8 select-none text-neutral-100 font-sans">
      {/* Moving Grain overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <header className="z-20 w-full max-w-xl text-center mb-8 pt-4 flex flex-col items-center">
        <h1 className="font-serif text-3xl font-medium tracking-wide text-neutral-100 uppercase">
          Kontrol Masası
        </h1>
        <p className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mt-1">
          System Session Director
        </p>
      </header>

      {/* RENDER AUTH SCREEN IF NOT LOGGED IN */}
      {!isLoggedIn ? (
        <section className="z-20 w-full max-w-md bg-[#121212] border border-neutral-900 rounded-[28px] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          
          <h2 className="font-serif text-xl font-medium tracking-wide text-neutral-200 uppercase mb-1">
            Yönetici Girişi
          </h2>
          <p className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-8">
            Authorized Controller Link
          </p>

          {/* Success Alerts */}
          {successMessage && (
            <div className="w-full bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 p-3.5 rounded-xl font-mono text-[10px] uppercase tracking-wide flex items-center gap-2 mb-6">
              <Check className="w-4 h-4 text-emerald-400" />
              {successMessage}
            </div>
          )}

          {/* Error Alerts (Geist Mono style) */}
          {authError && (
            <div className="w-full bg-red-950/20 border border-red-900/40 text-red-400 p-3.5 rounded-xl font-mono text-[10px] uppercase tracking-wide flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {authError}
            </div>
          )}

          {authMode === 'email' ? (
            /* EMAIL AUTHENTICATION FORM (PRIMARY METHOD) */
            <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">E-POSTA ADRESİ</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-900 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl focus:border-amber-500/50 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">ŞİFRE</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-900 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl focus:border-amber-500/50 outline-none transition-colors"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-neutral-100 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer mt-2"
              >
                {emailMode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
              </motion.button>

              <div className="flex justify-between items-center mt-2 px-1">
                <button
                  type="button"
                  onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                  className="font-mono text-[9px] text-neutral-500 hover:text-neutral-300 uppercase tracking-wider"
                >
                  {emailMode === 'signin' ? 'Hesap Oluştur ➔' : 'Giriş Ekranına Dön ➔'}
                </button>
              </div>

              {/* ALTERNATIVE METHODS SEPARATOR */}
              <div className="relative w-full flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-900"></div>
                </div>
                <span className="relative font-mono text-[8px] text-neutral-600 bg-[#121212] px-2.5 uppercase tracking-widest">Alternatif Giriş</span>
              </div>

              <div className="w-full flex flex-col gap-3">
                {/* Google OAuth Login Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full py-3 bg-neutral-950 border border-neutral-850 hover:border-neutral-750 text-neutral-300 font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google ile Giriş Yap
                </motion.button>

                {/* Phone Trigger */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => { setAuthMode('phone'); setAuthError(''); setSuccessMessage(''); }}
                  className="w-full py-3 bg-neutral-950 border border-neutral-900 hover:border-neutral-800 text-neutral-400 font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  SMS ile Giriş Yap (OTP)
                </motion.button>
              </div>
            </form>
          ) : (
            /* PHONE OTP SMS AUTHENTICATION FORM */
            <div className="w-full flex flex-col gap-4">
              {!isCodeSent ? (
                <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">TELEFON NUMARASI</label>
                    <input
                      type="tel"
                      placeholder="+905551234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-neutral-100 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer mt-2"
                  >
                    SMS Kodu Gönder
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">SMS DOĞRULAMA KODU</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl focus:border-amber-500/50 outline-none transition-colors text-center tracking-widest"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-neutral-100 text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer mt-2"
                  >
                    Kodu Doğrula
                  </motion.button>
                </form>
              )}

              {/* ALTERNATIVE METHODS SEPARATOR */}
              <div className="relative w-full flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-900"></div>
                </div>
                <span className="relative font-mono text-[8px] text-neutral-600 bg-[#121212] px-2.5 uppercase tracking-widest">Alternatif Giriş</span>
              </div>

              <div className="w-full flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full py-3 bg-neutral-950 border border-neutral-900 hover:border-neutral-800 text-neutral-400 font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl hover:text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google ile Giriş Yap
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => { setAuthMode('email'); setAuthError(''); setSuccessMessage(''); }}
                  className="font-mono text-[9px] text-neutral-500 hover:text-neutral-300 uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  E-mail ve Şifre Girişine Dön
                </motion.button>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* LOGGED IN VIEW */
        <section className="z-20 w-full max-w-xl flex flex-col gap-6 pb-12">
          
          {/* Welcome Message Header with Sign-out */}
          <div className="w-full flex items-center justify-between bg-[#121212] border border-neutral-900 px-5 py-4 rounded-[20px] shadow-lg">
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest">YÖNETİCİ GİRİŞİ YAPILDI</span>
              <h2 className="font-serif text-base text-neutral-200 font-medium">
                Hoş geldiniz, <span className="italic">{formatUserDisplayName()}</span>
              </h2>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="p-2 bg-neutral-950 border border-neutral-900 hover:border-red-950/40 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>

          {loading ? (
            <div className="z-20 flex flex-col items-center justify-center py-10">
              <Compass className="w-10 h-10 text-neutral-600 animate-spin-slow mb-3" />
              <div className="font-mono text-[10px] text-neutral-600 tracking-widest uppercase">
                Oturumlar aranıyor...
              </div>
            </div>
          ) : activeEvent ? (
            /* ACTIVE SESSION STATUS CARD */
            <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-x-0 top-0 h-12 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)]" />

              <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
                AKTİF SEANS DURUMU
              </span>

              <h2 className="font-serif text-2xl text-emerald-400 font-semibold tracking-wide flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {activeEvent.name}
              </h2>
              
              <div className="flex gap-4 mt-2">
                <span className="font-mono text-[8.5px] text-neutral-400 uppercase tracking-widest border border-neutral-800 px-2 py-0.5 rounded-md">
                  TİP: {EVENT_TYPES.find(t => t.id === activeEvent.event_type)?.name || 'Diğer'}
                </span>
                <span className="font-mono text-[8.5px] text-neutral-400 uppercase tracking-widest border border-neutral-800 px-2 py-0.5 rounded-md">
                  LİMİT: {activeEvent.max_guests > 9000 ? 'SINIRSIZ' : `${activeEvent.max_guests} MİSAFİR`}
                </span>
              </div>

              {/* Invite URL Copy Widget */}
              <div className="w-full mt-6 flex items-center gap-2 bg-[#0C0C0C] border border-neutral-900/60 p-2.5 rounded-xl shadow-inner max-w-sm mx-auto">
                <input
                  type="text"
                  readOnly
                  value={getInviteUrl()}
                  className="flex-1 bg-transparent border-none text-[10px] font-mono text-neutral-400 select-all outline-none pl-2 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* QR Image Display */}
              <div className="mt-6 p-4 bg-[#0A0A0A] border border-neutral-900 rounded-[20px] shadow-inner flex items-center justify-center">
                <img
                  src={getQrCodeUrl()}
                  alt="Invite QR Code"
                  className="w-48 h-48 rounded-lg border border-neutral-900 select-none bg-[#0A0A0A]"
                />
              </div>

              {/* Action Close (Banyo Et) Button */}
              <div className="w-full border-t border-neutral-900/60 mt-6 pt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinishSession}
                  className="w-full py-3.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-mono text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Power className="w-3.5 h-3.5" />
                  Filmleri Banyo Et (Etkinliği Bitir)
                </motion.button>
              </div>
            </div>
          ) : activeStep === 'dashboard' ? (
            /* EMPTY ACTIVE SESSION WELCOME CARD */
            <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-8 shadow-2xl flex flex-col items-center text-center">
              <Compass className="w-10 h-10 text-amber-500 animate-spin-slow mb-4" />
              <h3 className="font-serif text-xl font-medium text-neutral-200">Aktif Oturum Bulunmamaktadır</h3>
              <p className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mt-1 mb-6">Yeni bir dijital film seansı başlatın</p>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveStep('pricing'); setSessionError(''); }}
                className="w-full py-4 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-lg cursor-pointer transition-all"
              >
                Yeni Oturum Başlat 🚀
              </motion.button>
            </div>
          ) : activeStep === 'pricing' ? (
            /* CONFIGURATION & AUTO PACKAGE MAPPING STEP */
            <div className="flex flex-col gap-4">
              
              {/* Card 1: Event Name Input */}
              <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl flex flex-col">
                <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
                  SEANS KURULUMU
                </span>
                <h3 className="font-serif text-lg text-neutral-300 font-medium mb-3">Etkinlik İsmi</h3>
                
                <input
                  type="text"
                  placeholder="Etkinlik Adı"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-900 focus:border-amber-500/50 text-neutral-200 font-sans text-sm px-4 py-3 rounded-xl outline-none transition-colors shadow-inner"
                />
              </div>
              
              {/* Card 2: Concept Selector */}
              <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl flex flex-col">
                <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
                  KONSEPT SEÇİMİ
                </span>
                <h3 className="font-serif text-lg text-neutral-300 font-medium">Etkinlik Tipi</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  {EVENT_TYPES.map(type => {
                    const Icon = type.icon;
                    const isActive = selectedType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelectedType(type.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/5 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold'
                            : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'stroke-[2px]' : 'stroke-[1.5px]'}`} />
                        <span className="text-[10px] tracking-wide text-center uppercase font-mono">{type.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Dynamic Package Price Board (Auto-selected package based on type selection) */}
              <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl flex flex-col">
                <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
                  PAKET & FİYATLANDIRMA
                </span>
                <h3 className="font-serif text-lg text-neutral-300 font-medium mb-4">Etkinliğe Özel Paket</h3>

                <div className="w-full p-6 rounded-2xl border bg-amber-500/[0.02] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)] flex flex-col items-start relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="font-serif text-lg font-semibold text-neutral-200">{pkgDetails.packageName}</span>
                    <span className="font-mono text-sm text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      {pkgDetails.price}₺
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-4">
                    {selectedType.toUpperCase()} SEÇİMİNE ÖZEL
                  </p>
                  
                  <ul className="text-[10px] font-sans text-neutral-400 space-y-2 w-full">
                    <li className="flex items-center gap-1.5 font-mono text-[9.5px]">
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                      <span>AKTİFLİK: {pkgDetails.duration}</span>
                    </li>
                    {pkgDetails.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {sessionError && (
                <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl font-mono text-[10px] uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {sessionError}
                </div>
              )}

              {/* Navigation Action Triggers */}
              <div className="flex flex-col gap-2 mt-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDirectCreateEvent}
                  className="w-full py-4 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <Compass className="w-4 h-4 animate-spin" />
                      <span>Etkinlik Oluşturuluyor...</span>
                    </>
                  ) : (
                    <span>Etkinliği Oluştur 🚀</span>
                  )}
                </motion.button>
                <button
                  onClick={() => { setActiveStep('dashboard'); setSessionError(''); }}
                  className="font-mono text-[9px] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest text-center py-2"
                >
                  Dashboard'a Dön
                </button>
              </div>
            </div>
          ) : activeStep === 'checkout' ? (
            /* CHECKOUT CREDIT CARD SIMULATOR STEP */
            <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl flex flex-col gap-6">
              
              {/* Header metadata details */}
              <div className="flex flex-col items-center text-center">
                <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-1">
                  ÖDEME ALTYAPISI
                </span>
                <h3 className="font-serif text-lg text-neutral-300 font-medium">Güvenli Ödeme Simülatörü</h3>
                <p className="font-mono text-[8px] text-amber-500 uppercase tracking-wider mt-1">
                  KONSEPT: {EVENT_TYPES.find(t => t.id === selectedType)?.name.toUpperCase()} (TUTAR: {pkgDetails.price}₺)
                </p>
              </div>

              {/* Graphic Tactile Credit Card Preview Container */}
              <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/5 p-5 shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-9 h-7 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <CreditCard className="w-5.5 h-5.5 text-amber-500" />
                  </div>
                  <span className="font-mono text-[9px] text-amber-500/80 tracking-widest uppercase">DIJI CARD</span>
                </div>
                <div className="font-mono text-base tracking-widest text-neutral-300 select-all my-2">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between items-end font-mono">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-neutral-600 uppercase tracking-widest">KART SAHİBİ</span>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider truncate max-w-[150px]">{cardHolder || 'İSİM SOYİSİM'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] text-neutral-600 uppercase tracking-widest">S.K.T</span>
                    <span className="text-[10px] text-neutral-400">{cardExpiry || 'AA/YY'}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCompletePayment} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">KART SAHİBİ ADI SOYADI</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-900 focus:border-amber-500/50 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">KART NUMARASI</label>
                  <input
                    type="text"
                    required
                    maxLength="19"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-neutral-950 border border-neutral-900 focus:border-amber-500/50 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">S.K.T</label>
                    <input
                      type="text"
                      required
                      maxLength="5"
                      placeholder="AA/YY"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      className="w-full bg-neutral-950 border border-neutral-900 focus:border-amber-500/50 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl outline-none transition-colors text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest pl-1">CVC</label>
                    <input
                      type="password"
                      required
                      maxLength="3"
                      placeholder="123"
                      value={cardCvc}
                      onChange={handleCardCvcChange}
                      className="w-full bg-neutral-950 border border-neutral-900 focus:border-amber-500/50 text-neutral-300 font-mono text-[11px] px-4 py-3 rounded-xl outline-none transition-colors text-center"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={handleAutofillTestCard}
                    className="font-mono text-[9px] text-amber-500/80 hover:text-amber-400 uppercase tracking-wider"
                  >
                    💡 Test Bilgilerini Doldur
                  </button>
                </div>

                {sessionError && (
                  <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-3.5 rounded-xl font-mono text-[9px] uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    {sessionError}
                  </div>
                )}

                {/* Final Submit & Back buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={paymentProcessing}
                    className="w-full py-4 bg-neutral-100 hover:bg-white text-neutral-950 font-mono text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <Compass className="w-4 h-4 animate-spin" />
                        <span>ÖDEME İŞLENİYOR...</span>
                      </>
                    ) : (
                      <span>ÖDEMEYİ TAMAMLA</span>
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => { setActiveStep('pricing'); setSessionError(''); }}
                    className="font-mono text-[9px] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest text-center py-2"
                  >
                    Geri Dön
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* SUCCESS CHECKMARK TRANSITION PANEL */
            <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-8 shadow-2xl flex flex-col items-center justify-center text-center py-14">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
              >
                <Check className="w-8 h-8 stroke-[3px]" />
              </motion.div>
              <h3 className="font-serif text-xl font-medium text-neutral-200">Ödeme Başarılı!</h3>
              <p className="font-mono text-[9px] text-emerald-400/80 tracking-widest uppercase mt-2">
                OTOMATİK YÖNLENDİRİLİYORSUNUZ...
              </p>
            </div>
          )}

          {/* Past Sessions List */}
          <div className="bg-[#121212] border border-neutral-900 rounded-[28px] p-6 shadow-2xl flex flex-col">
            <span className="font-mono text-[9px] text-neutral-500 tracking-widest uppercase mb-4 border-b border-neutral-900 pb-2">
              SEANS GEÇMİŞİ DIRECTORY
            </span>

            {eventsList.length === 0 ? (
              <div className="text-center font-mono text-[10px] text-neutral-600 py-4 uppercase">
                Seans kaydı bulunamadı.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {eventsList.map(e => (
                  <div
                    key={e.id}
                    className="bg-[#0C0C0C] border border-neutral-900/60 p-4 rounded-xl flex flex-col gap-3 shadow-inner"
                  >
                    {/* Header Details Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="font-serif text-sm font-semibold text-neutral-200">
                          {e.name}
                        </span>
                        <span className="font-mono text-[8px] text-neutral-600">
                          {new Date(e.created_at).toLocaleString('tr-TR')} {e.price ? `| ${e.price}₺` : ''}
                        </span>
                      </div>

                      <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        e.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                      }`}>
                        {e.active ? 'Açık' : 'Banyo Edildi'}
                      </span>
                    </div>

                    {/* Action Buttons Toolbar Row */}
                    <div className="flex items-center gap-2 border-t border-neutral-900/40 pt-2.5">
                      {/* Göz At Button */}
                      <motion.a
                        whileTap={{ scale: 0.95 }}
                        href={e.active ? `/join/${e.id}` : `/reveal/${e.id}`}
                        className="flex-1 font-mono text-[9px] font-bold text-neutral-400 hover:text-white uppercase tracking-wider bg-neutral-950 border border-neutral-900 hover:border-neutral-800 px-3 py-2 rounded-lg text-center transition-colors"
                      >
                        Göz At
                      </motion.a>

                      {/* Albüme Git Button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(`/album/${e.id}`, '_blank')}
                        className="flex-1 font-mono text-[9px] font-bold text-neutral-400 hover:text-white uppercase tracking-wider bg-neutral-950 border border-neutral-900 hover:border-neutral-800 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Albüm Aç</span>
                      </motion.button>

                      {/* Link Kopyala Button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopyAlbumLink(e.id)}
                        className="p-2 bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white rounded-lg hover:border-neutral-800 transition-colors cursor-pointer"
                        title="Albüm Linkini Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 z-50 bg-[#121212] border border-emerald-950/40 text-emerald-400 px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
