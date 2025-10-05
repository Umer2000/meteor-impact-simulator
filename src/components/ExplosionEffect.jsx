import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export default function ExplosionEffect({ lat, lng, size, onEnd }) {
  const mesh = useRef();
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);

  // Convert lat/lng to 3D coordinates
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const radius = 100; // Earth's radius on globe scale

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  useFrame((_, delta) => {
    if (scale < 5) {
      setScale(scale + delta * 3);
      setOpacity(Math.max(0, opacity - delta * 2));
    } else {
      onEnd(); // remove explosion after animation
    }
  });

  return (
    <mesh ref={mesh} position={[x, y, z]} scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="orange" transparent opacity={opacity} />
    </mesh>
  );
}
