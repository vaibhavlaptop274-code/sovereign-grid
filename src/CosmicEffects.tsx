import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clouds, Cloud, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

export function CosmicEffects() {
  const wormholeRef = useRef<THREE.Mesh>(null)

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
  useFrame((state, delta) => {
    if (wormholeRef.current) {
      wormholeRef.current.rotation.z += delta * 0.4
    }
  })

  return (
    <group>
      {/* Dynamic Ambient Space Dust */}
      <Sparkles count={500} scale={30} size={2.5} speed={0.5} color="#00ffff" />

      {/* Volumetric Nebulas */}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud segments={40} bounds={[15, 5, 15]} volume={12} color="#7928ca" opacity={0.4} speed={0.2} />
        <Cloud segments={40} bounds={[12, 4, 12]} volume={10} color="#00dfd8" opacity={0.3} speed={0.3} />
      </Clouds>

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
