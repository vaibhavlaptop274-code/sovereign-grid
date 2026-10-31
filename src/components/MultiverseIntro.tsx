import { Canvas, useFrame } from '@react-three/fiber'
import { CosmicEffects } from './CosmicEffects'
import * as THREE from 'three'

// Camera Director component that flies through the wormhole
function CameraDirector() {
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    // Moves the camera smoothly forward down the wormhole path
    const zPos = -Math.sin(time * 0.2) * 10 - time * 3
    state.camera.position.set(0, 0, zPos + 10)
    state.camera.lookAt(0, 0, zPos - 10)
  })
  return null
}

export default function MultiverseIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden">
      {/* 3D Cinematic Canvas */}
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <color attach="background" args={['#0a0a0f']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        {/* The Wormhole & Nebula Manager */}
        <CosmicEffects />
        
        {/* Controls camera movement */}
        <CameraDirector />
      </Canvas>

      {/* Skip / Enter UI Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)]"
        >
          Enter Sovereign Grid
        </button>
      </div>
    </div>
  )
}
