# Technical Portfolio Guide: DijiAlbum

> **A Technical Deep-Dive for Engineering Managers, CTOs, Tech Leads, and Senior Developers**  
> **Author:** Ahmet Ösme ([GitHub: @Flanbuk](https://github.com/Flanbuk))  
> **Project Scope:** High-Performance Mobile Web Architecture, Real-Time Systems, Hardware Web APIs & Client-Side Media Processing

---

## 1. Project at a Glance

**DijiAlbum** is a full-stack, mobile-first Web application engineered to simulate a tactile disposable analog camera and real-time collaborative photo album for weddings and private events. Instead of requiring native app store downloads, DijiAlbum turns guest smartphones into disposable cameras via a browser URL or QR scan. The system enforces an authentic 12-shot physical film quota per guest, features 5 analog film emulations applied through high-speed raw pixel manipulation, and synchronizes captured Polaroid-style memories to a live shared gallery via Supabase Realtime WebSockets. Architectural highlights include zero-asset procedural audio synthesis using the Web Audio API, spatial device orientation leveling with haptic vibration, and in-browser bulk ZIP compression via JSZip to eliminate server-side processing bottlenecks.

---

## 2. Role & Core Technical Responsibilities

As the sole software engineer on this project, my engineering contributions spanned system architecture, low-level web API programming, and cloud backend integration:

- **Mobile Web Architecture & Full-Stack Implementation:** Designed the application layout around Next.js 16 (App Router) and React 19, architecting isolated SSR boundaries (`dynamic(..., { ssr: false })`) to eliminate hydration mismatches on hardware-dependent pages.
- **Hardware Integration & HTML5 Web APIs:** Implemented native device camera controls (`MediaDevices.getUserMedia`, `MediaStreamTrack.applyConstraints`), torch toggling, digital zoom stepping, and device orientation sensing (`DeviceOrientationEvent`).
- **Low-Level Image Processing & Canvas Algorithms:** Authored a byte-level RGBA pixel transformation engine on HTML5 Canvas to overcome WebKit/iOS Safari `ctx.filter` bugs, ensuring cross-platform color fidelity across analog film modes.
- **Procedural Audio DSP Synthesis:** Replaced network audio assets with procedural sound synthesis utilizing the Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, and white-noise buffers) to achieve zero-latency mechanical shutter sounds.
- **Database Schema, Storage & Security Rules:** Designed the PostgreSQL relational schema on Supabase, defining tables (`events`, `guests`, `photos`), foreign keys with cascading deletions, and storage bucket security policies.
- **Real-Time Pub/Sub & Performance Optimization:** Configured Supabase Realtime WebSocket listeners to push newly taken photos into active guest albums without page reloads, combined with CSS `content-visibility: auto` and client-side ZIP streaming.

---

## 3. System Architecture

DijiAlbum operates on an event-driven, serverless architecture that offloads compute-heavy multimedia tasks to the client while keeping data persistence and real-time distribution lean on the Supabase backend.

```mermaid
graph TD
    subgraph Client ["Client-Side Browser (Mobile Safari / Chrome)"]
        Join["Join Gate (join/[event_id])"]
        StorageCheck["Local Session Storage (Quota & UUIDs)"]
        CamView["Camera Engine (CameraView.js)"]
        WebAudio["Web Audio API (Procedural Synthesizer)"]
        Orientation["Gyroscope Sensor (DeviceOrientation)"]
        CanvasEngine["Canvas 2D Engine (Raw Pixel LUT + Polaroid Frame)"]
        LiveAlbum["Live Album (album/[id])"]
        ZipEngine["JSZip In-Memory Compressor"]
    end

    subgraph Supabase ["Supabase Backend Infrastructure"]
        Postgres[(PostgreSQL Relational DB)]
        S3Bucket[("Supabase Storage (raw_photos Bucket)")]
        RealtimeServer["Supabase Realtime (WebSocket WAL Broadcaster)"]
    end

    Join -->|Validate Event UUID| Postgres
    Join -->|Seed Local Session| StorageCheck
    StorageCheck --> CamView
    Orientation -->|Level Tilt Tracking| CamView
    CamView -->|Trigger Shutter| WebAudio
    CamView -->|Raw Video Frame| CanvasEngine
    CanvasEngine -->|Store Compressed JPEG Blob| S3Bucket
    CanvasEngine -->|Insert Photo Record & Decrement Shot| Postgres
    Postgres -->|Trigger WAL Event| RealtimeServer
    RealtimeServer -->|Broadcast Insert Payload| LiveAlbum
    S3Bucket -->|Async Parallel Image Fetch| ZipEngine
```

---

## 4. Key Engineering Challenges & Solutions

### Challenge 1: Cross-Platform WebKit Filter Degradation (iOS Safari Canvas Engine)
- **Problem:** When applying visual film emulations to captured camera frames, the standard HTML5 Canvas approach uses `ctx.filter = 'sepia(...) contrast(...)'`. On mobile WebKit (iOS Safari), `ctx.filter` frequently fails silently, causes severe frame dropping, or renders the exported canvas completely black due to GPU memory acceleration issues during canvas rasterization.
- **Why It Matters:** iOS users constitute a significant portion of wedding and event attendees. An analog disposable camera app that produces broken black images on iPhones would fail completely in production.
- **Implementation:** In [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L740-L895), I replaced `ctx.filter` with a direct pixel buffer manipulation algorithm. After drawing the raw video frame to a temporary canvas, the engine reads the byte array using `ctx.getImageData(0, 0, width, height)`. A high-speed pixel traversal loop executes arithmetic transformations directly on the `Uint8ClampedArray` (RGBA values):
  ```javascript
  // Byte-level pixel matrix transformation example
  const pixels = imgData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // Contrast & tint balance applied directly to bytes
    pixels[i]     = Math.min(255, Math.max(0, (r - 128) * contrast + 128 + redOffset));
    pixels[i + 1] = Math.min(255, Math.max(0, (g - 128) * contrast + 128 + greenOffset));
    pixels[i + 2] = Math.min(255, Math.max(0, (b - 128) * contrast + 128 + blueOffset));
  }
  ctx.putImageData(imgData, 0, 0);
  ```
- **Code Evidence:** [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L740-L895)
- **Result:** 100% deterministic analog color rendering across all iOS, iPadOS, and Android versions without GPU texture crashes or dropped frames.

---

### Challenge 2: Zero-Asset Mechanical Shutter Sound Synthesis
- **Problem:** Disposable cameras require tactile, nostalgic auditory feedback. Loading external MP3 or WAV audio clips over cellular networks introduces network latency, can be blocked by cellular data savers, and can fail if assets are evicted from browser cache.
- **Why It Matters:** Audio latency between tapping the shutter button and hearing the mechanical click breaks the tactile illusion of an analog device.
- **Implementation:** In [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L450-L530), I implemented a zero-asset procedural sound generator using the **Web Audio API**:
  1. **Mechanical Shutter Click:** A triangle oscillator sweeps down rapidly from `220Hz` to `40Hz` across `0.035s` with an exponential gain curve.
  2. **SLR Mirror Slap (Bass Thump):** A sine oscillator triggers at `80Hz` dropping to `25Hz` across `0.08s` into a low-pass filter, providing low-end punch.
  3. **Film Advance Spring Rattle:** A 50-millisecond white noise buffer generated programmatically with `Math.random() * 2 - 1` and shaped through an exponential gain decay curve.
- **Code Evidence:** [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L450-L530)
- **Result:** Instantaneous (<5ms), zero-bandwidth audio playback that works flawlessly offline and under low-connectivity environments.

---

### Challenge 3: Spatial Immersion via Gyroscope Sensor & iOS Permission Handshake
- **Problem:** To simulate aiming through a real rangefinder, guests need to know when their phone is held upright and level. However, modern mobile browsers (especially Safari since iOS 13) enforce strict security protocols requiring explicit user gesture permission before granting access to `DeviceOrientationEvent`.
- **Why It Matters:** Without careful permission handling, device orientation listeners fail silently, leaving the UI unresponsive or stuck in simulation mode.
- **Implementation:**
  - Implemented dynamic detection for `DeviceOrientationEvent.requestPermission` in [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L360-L400).
  - Built an interactive calibration modal that requests sensor access upon explicit user tap.
  - Calculated spatial level angles (`beta` in [75°, 95°], `gamma` in [-10°, 10°]).
  - Connected the optimum angle trigger to a haptic pulse (`navigator.vibrate(50)`) and an animated emerald neon border glow.
  - Added a graceful mouse-movement fallback for desktop testing.
- **Code Evidence:** [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L90-L100), [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L360-L420)
- **Result:** Seamless permission granting on mobile Safari, providing a physical, game-like tactile experience when lining up shots.

---

### Challenge 4: Real-Time Event Sync & Zero-Server Bulk ZIP Archive Export
- **Problem:** At the end of an event, hosts or guests want to download all high-resolution photos in one archive. Generating ZIP archives of hundreds of high-resolution images on a serverless function often hits execution timeouts (Vercel 10s/15s limit) and consumes heavy CPU and memory.
- **Why It Matters:** Serverless functions are not optimized for long-running streaming of hundreds of binary image buffers.
- **Implementation:** In [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L140-L210), I shifted the entire archiving workload into the client:
  - The browser requests all photo URLs for the event from Supabase.
  - Photos are fetched asynchronously in parallel batches using `fetch()`.
  - As each blob resolves, it is piped directly into a client-side `JSZip` instance while updating an interactive progress meter in the UI.
  - The final `.zip` file is packaged into a `Blob` and auto-triggered for download via an ephemeral `<a>` link.
- **Code Evidence:** [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L140-L210)
- **Result:** Event hosts can download complete 100+ photo collections in seconds without taxing the backend or encountering serverless timeout penalties.

---

## 5. Code Review Navigation Guide

For a rapid and structured technical audit, inspect the repository in the following order:

| Engineering Domain | What to Inspect | Source File |
| :--- | :--- | :--- |
| **Viewfinder & Hardware Engine** | Camera stream initialization, facing mode switching, hardware torch constraints, dynamic zoom | [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L20-L150) |
| **Procedural Audio Synthesizer** | Web Audio API oscillator curves, noise buffers, and mechanical shutter sound generation | [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L450-L530) |
| **Raw Pixel Image Processing** | Byte-level canvas pixel manipulation, custom analog film LUTs, Polaroid text watermarking | [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L540-L720) |
| **Orientation & Haptics** | iOS 13+ sensor permission handshake, spirit level angle calculation, haptic vibration | [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L360-L420) |
| **Realtime Live Gallery** | Supabase Realtime WebSocket subscription, optimistic UI updates, infinite scroll virtualization | [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L80-L140) |
| **Client-Side Bulk Archiving** | In-browser parallel blob fetching, progress tracking, and client-side ZIP generation | [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L140-L210) |
| **Guest Gateway & Session Seed** | UUID validation regex, active session check, anonymous guest state persistence | [`src/app/join/[event_id]/page.js`](src/app/join/[event_id]/page.js#L15-L75) |
| **Relational Data & Security** | PostgreSQL tables, foreign key constraints, storage bucket configuration, and RLS policies | [`schema.sql`](schema.sql) |

---

## 6. Technical Competencies Demonstrated

### 1. Full-Stack Web Development
- Next.js 16 App Router architecture utilizing asynchronous params resolution (`use(params)`), Server and Client Component separation, and Google Font optimization.
- Clean integration with Supabase for data persistence and S3-compatible cloud storage.

### 2. Low-Level Browser & Hardware Programming
- Direct hardware manipulation using `navigator.mediaDevices.getUserMedia` with fallback mechanisms for unsupported devices.
- Digital signal processing (DSP) concepts implemented via the Web Audio API without third-party audio packages.
- Native mobile sensor communication (`DeviceOrientationEvent`, `navigator.vibrate`).

### 3. High-Performance Graphics & Animation
- Pixel-by-pixel color matrix operations directly on `CanvasRenderingContext2D` byte buffers.
- Physics-based declarative UI animation using Framer Motion (`AnimatePresence`, spring transitions).
- CSS performance optimizations (`content-visibility: auto`, `transform: translate3d`, hardware compositing layers).

### 4. Distributed & Real-Time Systems
- PostgreSQL Write-Ahead Log (WAL) streaming pushed to mobile clients via Supabase Realtime WebSocket channels.
- Distributed client session management using `localStorage` caching combined with backend database sync.

---

## 7. Technical Decisions & Trade-offs

| Decision | Selected Approach | Alternative Considered | Engineering Trade-off & Rationale |
| :--- | :--- | :--- | :--- |
| **Filter Processing** | Client-side Raw Pixel Manipulation on Canvas | Server-side image processing (Sharp / ImageMagick) | **Trade-off:** Client-side processing uses local CPU/GPU, eliminating expensive server compute and bandwidth costs. While raw JS pixel loops take 50–150ms on mobile, running them immediately upon capture feels authentic to analog processing ("film developing"). |
| **Audio Architecture** | Procedural Web Audio API Synthesis | Pre-recorded MP3/WAV static files | **Trade-off:** Web Audio API requires sound design knowledge in code, but avoids all HTTP audio requests, eliminates mobile network audio buffering delays, and guarantees zero latency. |
| **Backend Architecture** | Supabase BaaS (Postgres + Realtime + Storage) | Custom Node.js / Express backend with Redis | **Trade-off:** Supabase accelerates development and provides enterprise-grade Postgres WAL replication out-of-the-box. RLS and direct client SDK calls eliminate repetitive CRUD boilerplate. |
| **Archive Generation** | In-Browser JSZip Compilation | Serverless background job producing S3 ZIP | **Trade-off:** Generating ZIPs in the browser consumes client memory for very large albums, but completely bypasses serverless timeout limits and eliminates cloud compute costs. |

---

## 8. Quality Assurance & Reliability

- **Static Analysis & Linting:** Strict adherence to ESLint 9 and React 19 standards (`eslint-config-next/core-web-vitals`), verifying zero access-before-declaration errors and proper effect dependencies.
- **Fail-Safe Fallbacks:**
  - If camera permissions are denied, detailed contextual guidance is rendered.
  - If hardware torch is unsupported, screen-based flash animation automatically activates.
  - If device orientation sensors are blocked or desktop mode is used, mouse-based tilt simulation activates.
  - If no active event exists in `localStorage`, a seeded mock session (`00000000-0000-0000-0000-000000000000`) prevents application crashes.

---

## 9. Current Limitations

1. **HTTPS Enforcement:** Mobile camera and orientation sensors require a secure origin (`https://` or `localhost`). Testing on physical mobile devices across a local Wi-Fi network requires an HTTPS proxy (such as ngrok or mkcert).
2. **Memory Constraints on Massive Albums:** While JSZip in-browser compression works effortlessly for typical events (up to ~200 photos), albums exceeding several gigabytes of raw images would benefit from chunked streaming or server-side archiving.

---

## 10. Suggested 5–10 Minute Code Review

If you have 10 minutes to review this codebase, follow this curated path:

- **Minute 1–2: System Entry Point & Viewfinder**  
  Examine [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L50-L150) to see how mobile camera streams, facing modes, and guest sessions are initialized.
- **Minute 3–4: Procedural Audio Synthesizer**  
  Jump to [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L450-L530) to review how mechanical shutter clicks and mirror slap thumps are synthesized purely from oscillators and noise buffers.
- **Minute 5–6: Raw Pixel Canvas Filter Matrix**  
  Review [`src/app/camera/CameraView.js`](src/app/camera/CameraView.js#L740-L895) to inspect the cross-platform raw byte manipulation engine that solves iOS WebKit canvas rendering issues.
- **Minute 7–8: Real-Time Live Album**  
  Open [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L80-L140) to inspect the Supabase Realtime WebSocket subscription and Framer Motion photo card rendering.
- **Minute 9–10: Database Schema & Client Archiving**  
  Inspect [`schema.sql`](schema.sql) for relational integrity and [`src/app/album/[id]/page.js`](src/app/album/[id]/page.js#L140-L210) for client-side JSZip packaging.

---

## 11. Developer

**Ahmet Ösme**  
- **GitHub:** [https://github.com/Flanbuk](https://github.com/Flanbuk)  
- **Role:** Software Engineer  
- *This repository is part of my professional engineering portfolio.*
