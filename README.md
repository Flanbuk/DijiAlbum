# DijiAlbum 📷

> **Tactile Digital Nostalgic Disposable Camera & Live Event Album SaaS**  
> An interactive web application built with **Next.js 16 (App Router)**, **React 19**, and **Supabase**, designed to bring the analog warmth, physical intimacy, and anticipation of vintage disposable cameras to weddings, parties, and special gatherings.

---

### For Recruiters & Engineers
Interested in the deep architecture, complex technical challenges, and engineering decisions behind this project?  
👉 **Read the [Technical Portfolio Guide](PORTFOLIO_GUIDE.md)** for a structured walkthrough of the implementation, custom algorithms, and key source files.

---

## 1. Project Overview

**DijiAlbum** transforms ordinary smartphones into physical disposable cameras for event guests without requiring any app download or sign-up. 

### The Problem It Solves
At weddings, engagements, and private celebrations, guests take hundreds of isolated photos on their personal camera rolls. Event hosts rarely see these authentic candid moments, or must spend weeks collecting messy cloud drive links. Traditional photo booths are stationary and expensive, while standard shared albums lack spontaneous emotional engagement.

### The Solution
Guests simply scan a table QR code to enter the event session. The web app calibrates their mobile camera into a nostalgic disposable camera featuring:
- A physical **12-shot film limit** per guest, fostering intentional, cherished candid shots.
- **5 analog film stocks** (Portra 400, Tri-X 400, Fuji Velvia, CineStill 800T, Kodachrome 64) applied via raw canvas pixel manipulation.
- **Spatial spirit level** using mobile gyroscope/accelerometer sensors with haptic vibration feedback.
- **Synthetic mechanical shutter sounds** synthesized purely in code via the Web Audio API (zero audio files loaded).
- **Polaroid framing** with dynamic guest signatures and amber digital date stamps.
- **Instant live event stream** powered by Supabase Realtime WebSockets, allowing hosts and guests to view the collective album dynamically, or participate in a post-event "Darkroom Reveal".

---

## 2. Key Features

- **Zero-Install QR Onboarding:** Guests scan a dynamic event QR code, validating session UUIDs and auto-provisioning guest credentials in `localStorage` without passwords or App Store friction.
- **Interactive Retro Viewfinder:** Full-screen 100dvh analog viewfinder with exposure framing, battery indicator, dynamic 1.0x/1.2x optical-style zoom, and front/back camera toggling.
- **Hardware Torch & Screen Flash:** Automated device inspection checks for hardware torch support (`MediaStreamTrack.applyConstraints`). If unsupported (e.g., iOS Safari front camera), an animated screen flash fallback takes over.
- **Gyroscope Spirit Level:** Utilizes the HTML5 `DeviceOrientation` API with iOS 13+ permission handshakes. Viewfinder border illuminates in neon emerald with haptic vibration when held at the optimal level angle.
- **Web Audio Shutter Synthesizer:** Real-time synthesis of mechanical click sounds, spring recoils, and SLR mirror slap thumps using Web Audio `OscillatorNode`, `GainNode`, and `BiquadFilterNode`—eliminating static media assets.
- **Raw Pixel Color Matrix Engine:** Bypasses known iOS WebKit canvas bugs (where `ctx.filter` fails or produces black frames) by applying manual RGBA byte-level transformations for vintage grain, warmth, sepia, and tungsten balance.
- **Polaroid Watermarking Engine:** Combines the captured frame, classic Polaroid white border, handwritten font signature, and 7-segment digital timecode onto an HTML5 Canvas export.
- **Real-Time Live Album:** WebSocket subscription via Supabase Realtime (`postgres_changes` on PostgreSQL `photos` table) displays incoming guest photos live with staggered Framer Motion layout transitions.
- **Client-Side Bulk ZIP Download:** Uses `JSZip` to download and compress all high-resolution event photos directly inside the browser memory, reducing server compute to zero.
- **Darkroom Reveal Gallery:** An alternative event mode where photos remain concealed until the host ends the event, triggering a synchronized photographic film development reveal.

---

## 3. Tech Stack

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16.2.9** (App Router, Server & Client Components) |
| **UI Library** | **React 19.2.4** (Hooks, Dynamic Imports, Concurrency) |
| **Styling & Design System** | **Tailwind CSS v4** (`@tailwindcss/postcss`), Custom CSS Grain Shaders |
| **Animations & Transitions** | **Framer Motion 12.42.0** (`AnimatePresence`, `layoutId`, Spring Physics) |
| **Backend & Database** | **Supabase** (PostgreSQL 15+, Row Level Security) |
| **Realtime & Storage** | **Supabase Realtime** (WebSockets), **Supabase Storage** (S3-compatible bucket) |
| **Web Hardware APIs** | MediaDevices (`getUserMedia`), DeviceOrientation, Web Audio API, Vibration API |
| **Client Utilities** | **JSZip 3.10.1** (browser compression), **Lucide React 1.21.0** (vector icons) |
| **Typography** | `next/font/google` (*Geist Sans*, *Geist Mono*, *Cormorant Garamond*) |

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Browser (Mobile / Desktop)"]
        UI["Next.js 16 / React 19 UI"]
        Camera["HTML5 MediaStream (Camera Feed)"]
        Sensors["DeviceOrientation (Gyroscope)"]
        Audio["Web Audio API Synthesizer"]
        Canvas["HTML5 Canvas 2D (Raw Pixel Processing)"]
        Zip["JSZip Client Compression"]
    end

    subgraph Supabase ["Supabase Backend Infrastructure"]
        Auth["Anonymous / Guest Session Provider"]
        DB[(PostgreSQL Database: events, guests, photos)]
        Storage["Supabase Storage: raw_photos bucket"]
        Realtime["Supabase Realtime (WebSockets)"]
    end

    Camera -->|Live Video Stream| Canvas
    Sensors -->|Tilt Angles (Beta/Gamma)| UI
    UI -->|Trigger Shutter| Audio
    Canvas -->|Polaroid + Film LUT Render| Storage
    Canvas -->|Photo Metadata Insert| DB
    DB -->|WAL Insert Event| Realtime
    Realtime -->|WebSocket Push| UI
    Storage -->|Blob Fetch| Zip
```

---

## 5. Engineering Highlights

### 1. Zero-Asset Audio Synthesis (`Web Audio API`)
Rather than loading static MP3/WAV audio files over the network (which introduce latency and fail when offline or on low-bandwidth cellular networks), DijiAlbum generates high-fidelity analog mechanical sounds programmatically:
- A triangle oscillator with an exponential pitch drop (`220Hz -> 40Hz` in 35ms) simulates the physical shutter click.
- A filtered white-noise burst processed through a low-pass biquad filter creates the mechanical film advance spring rattle.
- An exponential gain ramp creates a satisfying bass "mirror slap" thump.

### 2. Cross-Browser Raw Pixel Manipulation (iOS Safari Canvas Engine)
On mobile Safari (WebKit), applying CSS or `ctx.filter` directly to an HTML5 canvas during `drawImage` frequently results in blank/black canvases or ignored CSS filters due to WebKit hardware acceleration quirks.  
DijiAlbum solves this by reading the raw pixel array via `ctx.getImageData()` and performing byte-level RGB matrix transformations in a high-speed JavaScript loop, ensuring identical film aesthetic reproduction across iOS, iPadOS, and Android.

### 3. Progressive Infinite Scroll & DOM Virtualization
The live event album (`/album/[id]`) supports hundreds of guest uploads. To prevent DOM bloat and mobile browser memory crashes:
- Images are batched into chunks of 12.
- Grid items leverage CSS `content-visibility: auto` with `contain-intrinsic-size` to skip offscreen layout calculation.
- Framer Motion transitions run strictly on GPU composited layers (`transform: translate3d`).

---

## 6. Project Structure

```text
DijiAlbum/
├── public/                 # Static assets and icons
├── src/
│   ├── app/
│   │   ├── album/[id]/     # Real-time live album view & bulk ZIP download
│   │   │   ├── page.js
│   │   │   └── error.js
│   │   ├── camera/         # Disposable camera viewfinder & capture logic
│   │   │   ├── page.js     # Dynamic client wrapper (ssr: false)
│   │   │   └── CameraView.js # Core camera engine, canvas filters, audio synthesizer
│   │   ├── join/[event_id]/# QR code entrance & guest onboarding session gateway
│   │   │   ├── page.js
│   │   │   └── error.js
│   │   ├── reveal/[event_id]/ # Post-event darkroom reveal gallery
│   │   │   └── page.js
│   │   ├── globals.css     # Tailwind v4 directives, analog grain keyframe shader
│   │   ├── layout.js       # Root layout & Google Fonts configuration
│   │   └── page.js         # Root splash & access-restriction landing
│   └── lib/
│       └── supabase.js     # Supabase client singleton
├── schema.sql              # PostgreSQL DDL, schema relations & storage RLS policies
├── .env.example            # Environment variables template
├── eslint.config.mjs       # Next.js & React 19 ESLint configuration
├── next.config.mjs         # Next.js image domain whitelist & compilation settings
├── package.json            # Project dependencies & scripts
└── PORTFOLIO_GUIDE.md      # Deep technical walkthrough for senior reviewers
```

---

## 7. Getting Started

### Prerequisites
- **Node.js** `v18.18.0` or higher (Node 20+ recommended)
- **npm**, **pnpm**, or **yarn**
- A **Supabase** account (Free tier works seamlessly)

### 1. Clone the Repository
```bash
git clone https://github.com/Flanbuk/DijiAlbum.git
cd DijiAlbum
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```
Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
```

### 4. Provision Supabase Database & Storage
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Paste and execute the contents of [`schema.sql`](schema.sql).
   - Creates the `events`, `guests`, and `photos` tables.
   - Sets up cascade delete foreign keys.
   - Creates the public `raw_photos` storage bucket with anonymous upload policies.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or device simulator.

### 6. Lint & Static Analysis
```bash
npm run lint
```

---

## 8. Development Status & Roadmap

| Feature | Status | Notes |
| :--- | :---: | :--- |
| **QR Guest Entry & Validation** | ✅ Complete | Dynamic UUID validation, session persistence |
| **MediaStream Camera Engine** | ✅ Complete | Front/back camera toggle, hardware zoom & torch |
| **5 Analog Film Emulations** | ✅ Complete | Raw pixel matrix manipulation (WebKit compliant) |
| **Synthetic Shutter Audio** | ✅ Complete | Web Audio API oscillator/noise synthesis |
| **Gyroscope Spirit Level** | ✅ Complete | DeviceOrientation API with iOS permission flow |
| **Polaroid Stamp Engine** | ✅ Complete | HTML5 Canvas composition with date & signature |
| **Supabase Realtime Live Album** | ✅ Complete | Instant photo propagation via WebSockets |
| **In-Browser Bulk ZIP Download** | ✅ Complete | Zero-server JSZip archive generation |
| **Post-Event Darkroom Reveal** | ✅ Complete | Paginated reveal gallery for closed sessions |
| **Host Admin Dashboard** | 🚧 Roadmap | Host event creation and billing integration |
| **PWA Offline Support** | 🚧 Roadmap | ServiceWorker camera caching when network drops |

---

## 9. Author

**Ahmet Ösme**  
- GitHub: [@Flanbuk](https://github.com/Flanbuk)  
- Portfolio Guide: [PORTFOLIO_GUIDE.md](PORTFOLIO_GUIDE.md)

*Presented as part of a professional software engineering portfolio.*
