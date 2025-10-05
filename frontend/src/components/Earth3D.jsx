import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Sphere, MeshStandardMaterial } from "three";
import { useMemo } from "react";

export default function Earth3D({ asteroids }) {
  const positions = useMemo(() =>
    asteroids.map((a) => ({
      name: a.name,
      x: Math.random() * 4 - 2,
      y: Math.random() * 4 - 2,
      z: Math.random() * 4 - 2,
      size: a.diameter_km / 10
    }))
  , [asteroids]);

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <Stars />
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial color="#0a1f44" wireframe />
      </mesh>

      {positions.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <sphereGeometry args={[a.size * 0.02, 16, 16]} />
          <meshStandardMaterial color={a.hazardous ? "red" : "yellow"} />
        </mesh>
      ))}

      <OrbitControls enableZoom />
    </Canvas>
  );
}
