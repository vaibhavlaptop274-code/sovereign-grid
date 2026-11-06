export function CyberAvatar(props: Record<string, unknown>) {
  return (
    <group {...props} dispose={null}>
      <pointLight position={[0, 0.5, 0]} color="#00ffcc" intensity={2} distance={3} />
      <mesh scale={1.5} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.35, 1.0, 8, 16]} />
        <meshStandardMaterial color="#00ffcc" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}
