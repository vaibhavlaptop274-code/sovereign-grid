import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clouds, Cloud, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

export function CosmicEffects() {
  const wormholeRef = useRef<THREE.Mesh>(null)

  // 1. Create a curving 3D path for the wormhole tunnel
  const curve = useMemo(() => {
    const points = []
    for (let i = 0; i < 50; i++) {
      points.push(
        new THREE.Vector3(
          Math.sin(i * 0.2) * 3,
          Math.cos(i * 0.2) * 3,
          -i * 2
        )
      )
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  // 2. Slowly spin the wormhole energy every frame
  useFrame((_, delta) => {
    if (wormholeRef.current) {
      wormholeRef.current.rotation.z += delta * 0.5
    }
  })

  return (
    <group>
      {/* Glowing Space Dust */}
      <Sparkles count={400} scale={25} size={2} speed={0.6} color="#00ffff" />

      {/* Volumetric 3D Nebulas */}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud segments={40} bounds={[12, 4, 12]} volume={10} color="#7928ca" opacity={0.45} speed={0.2} />
        <Cloud segments={40} bounds={[10, 3, 10]} volume={8} color="#00dfd8" opacity={0.35} speed={0.3} />
      </Clouds>

      {/* Twisting Wormhole Tunnel */}
      <mesh ref={wormholeRef}>
        <tubeGeometry args={[curve, 100, 2, 32, false]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#7928ca"
          emissiveIntensity={2}
          wireframe={true}
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}
