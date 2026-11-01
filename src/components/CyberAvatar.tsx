import { useGLTF } from '@react-three/drei';

export function CyberAvatar(props: Record<string, unknown>) {
  const { scene } = useGLTF('/cyber_merc.glb');

  return (
    <group {...props} dispose={null}>
      <pointLight position={[0, 0.5, 0]} color="#00ffcc" intensity={2} distance={3} />
      <primitive object={scene} scale={1.5} position={[0, 0, 0]} />
    </group>
  );
}
