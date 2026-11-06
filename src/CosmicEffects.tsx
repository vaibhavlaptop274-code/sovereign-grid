import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function CosmicEffects() {
  const wormholeRef = useRef<THREE.Mesh>(null)

  const dustPositions = useMemo(() => {
    const pos = new Float32Array(500 * 3)
    for (let i = 0; i < 500 * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 30
    }
    return pos
  }, [])

  // Creates a twisting 3D path for the wormhole tunnel
  const curve = useMemo(() => {
    const points = []
    for (let i = 0; i < 60; i++) {
      points.push(
        new THREE.Vector3(
          Math.sin(i * 0.25) * 4,
          Math.cos(i * 0.25) * 4,
          -i * 2.5
        )
      )
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  // Slowly spins and pulses the wormhole energy every frame
  useFrame((_state, delta) => {
    if (wormholeRef.current) {
      wormholeRef.current.rotation.z += delta * 0.4
    }
  })

  return (
    <group>
      {/* Dynamic Ambient Space Dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.18} color="#00ffff" transparent opacity={0.8} />
      </points>

      {/* Sci-Fi Wormhole Tunnel Mesh */}
      <mesh ref={wormholeRef}>
        <tubeGeometry args={[curve, 120, 2.5, 32, false]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#7928ca"
          emissiveIntensity={2.5}
          wireframe={true}
          side={THREE.DoubleSide}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  )
}
