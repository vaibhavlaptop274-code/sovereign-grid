import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FastForward, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface MultiverseIntroProps {
  onComplete: () => void;
  /** Optional: pass a video URL (like "/intro.mp4") if you ever want to play an MP4 instead of the 3D wormhole */
  videoUrl?: string;
}

export default function MultiverseIntro({ onComplete, videoUrl }: MultiverseIntroProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phaseText, setPhaseText] = useState('YOU THINK YOU KNOW HOW THE WORLD WORKS...');
  const [subText, setSubText] = useState('ASTRAL PROJECTION INITIALIZING');
  const [flashWhite, setFlashWhite] = useState(false);
  const [muted, setMuted] = useState(false);

  // Synthesize a cosmic Doctor-Strange warp sound using Web Audio API (no external MP3 needed)
  useEffect(() => {
    if (muted) return;
    let ctx: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AudioCtx();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.18, now);
      master.gain.exponentialRampToValueAtTime(0.001, now + 6.2);
      master.connect(ctx.destination);

      // Deep astral drone + rising multiverse pitch
      [110, 164.81, 220, 329.63].forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * 0.5, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.4);
        osc.frequency.exponentialRampToValueAtTime(freq * 3.2, now + 5.5);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 6.0);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 6.1);
      });
    } catch {
      // Ignore if browser blocks autoplay audio
    }
    return () => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, [muted]);

  // Keyboard shortcut: ESC or SPACE to skip intro
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  // Three.js Multiverse Sequence ("The Astral Push" -> "Open Your Eyes" -> "Multiverse Tunnel")
  useEffect(() => {
    if (videoUrl) return; // Skip 3D scene if using custom MP4 video mode
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050214, 0.012);

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Doctor Strange Eldritch Mandala Rings (Golden / Cyan Sacred Geometry)
    const mandalaGroup = new THREE.Group();
    scene.add(mandalaGroup);

    const ringColors = [0xf59e0b, 0x00f0ff, 0xd946ef, 0xfacc15, 0x38bdf8];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.RingGeometry(2.2 + i * 1.15, 2.32 + i * 1.15, i % 2 === 0 ? 6 : 12);
      const mat = new THREE.MeshBasicMaterial({
        color: ringColors[i % ringColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = -i * 0.4;
      mandalaGroup.add(ring);
    }

    // 2. Multiverse Dimensional Portals along the Wormhole Z-Axis
    const portalGroup = new THREE.Group();
    scene.add(portalGroup);
    const portalCount = 45;
    for (let i = 0; i < portalCount; i++) {
      const radius = 5 + (i % 4) * 1.8;
      const sides = i % 3 === 0 ? 6 : i % 2 === 0 ? 8 : 32;
      const geo = new THREE.TorusGeometry(radius, 0.08, 8, sides);
      const mat = new THREE.MeshBasicMaterial({
        color: ringColors[i % ringColors.length],
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const torus = new THREE.Mesh(geo, mat);
      torus.position.z = -15 - i * 14;
      torus.rotation.z = i * 0.4;
      portalGroup.add(torus);
    }

    // 3. 5,000 High-Speed Multiverse Warp Stars
    const starCount = 5000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0x00f0ff),
      new THREE.Color(0xd946ef),
      new THREE.Color(0xf59e0b),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 45;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = -Math.random() * 650;

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Timeline triggers matching the Doctor Strange clip
    const t1 = setTimeout(() => {
      setPhaseText('OPEN YOUR EYES');
      setSubText('BREAKING MATERIAL DIMENSION...');
    }, 1300);

    const t2 = setTimeout(() => {
      setPhaseText('INFINITE MULTIVERSE');
      setSubText('ENTERING SOVEREIGN GRID SOLAR SYSTEM');
    }, 3100);

    const t3 = setTimeout(() => {
      setFlashWhite(true);
    }, 5500);

    const t4 = setTimeout(() => {
      onComplete();
    }, 6200);

    // Animation loop
    const startTime = performance.now();
    let frameId = 0;

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const elapsed = (now - startTime) / 1000;

      // Rotate Eldritch Mandala rings in opposite directions
      mandalaGroup.children.forEach((child, idx) => {
        child.rotation.z += (idx % 2 === 0 ? 1 : -1) * 0.025 * (1 + elapsed);
      });

      if (elapsed < 1.3) {
        // Act 1: The Astral Pull-back ("You think you know how the world works...")
        camera.position.z = 18 + Math.sin(elapsed * 2) * 2.5;
        camera.fov = 65 - elapsed * 8;
        camera.updateProjectionMatrix();
      } else {
        // Act 2 & 3: "OPEN YOUR EYES" -> Hyper-warp blast through the multiverse
        const warpTime = elapsed - 1.3;
        const speed = Math.min(180, 25 + warpTime * warpTime * 38);

        camera.position.z -= speed * 0.016;
        camera.rotation.z = Math.sin(warpTime * 1.8) * 0.65 + warpTime * 0.45;
        camera.position.x = Math.sin(warpTime * 3.5) * 1.8;
        camera.position.y = Math.cos(warpTime * 2.7) * 1.8;

        // Stretch FOV for warp-speed sensation
        camera.fov = Math.min(115, 55 + warpTime * 22);
        camera.updateProjectionMatrix();

        // Spin dimensional portals
        portalGroup.children.forEach((portal, i) => {
          portal.rotation.z += (i % 2 === 0 ? 0.04 : -0.04);
          if (portal.position.z > camera.position.z + 5) {
            portal.position.z -= portalCount * 14;
          }
        });
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [onComplete, videoUrl]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* 3D Wormhole Canvas OR Custom Video */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          playsInline
          muted={muted}
          onEnded={onComplete}
          className="h-full w-full object-cover"
        />
      ) : (
        <div ref={mountRef} className="h-full w-full" />
      )}

      {/* Center Cinematic HUD Text */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-950/70 px-4 py-1 text-xs font-mono tracking-[0.25em] text-cyan-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
          {subText}
        </div>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-white drop-shadow-[0_0_30px_rgba(0,240,255,0.65)] transition-all duration-500">
          {phaseText}
        </h1>
      </div>

      {/* Bottom Controls: Mute & Skip Intro */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setMuted((m) => !m)}
          className="glass-pill flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white"
        >
          {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          {muted ? 'Muted' : 'Audio On'}
        </button>

        <button
          onClick={onComplete}
          className="glass-pill flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-xs font-semibold tracking-wider text-cyan-200 hover:bg-cyan-500/35 hover:text-white"
        >
          <span>SKIP INTRO</span>
          <FastForward className="h-3.5 w-3.5" />
          <span className="kbd-badge ml-1">ESC</span>
        </button>
      </div>

      {/* White-Cyan Slam Transition Flash at the end */}
      <div
        className={`pointer-events-none fixed inset-0 z-30 bg-cyan-100 transition-opacity duration-700 ${
          flashWhite ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
