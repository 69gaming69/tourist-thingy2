"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const BG_URL = "/14343543-827d-48c7-b416-29857f285623.png";

export default function LoginBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const loader = new THREE.TextureLoader();
    loader.load(BG_URL, (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      material.map = texture;
      material.needsUpdate = true;
    });

    const pointer = { x: 0, y: 0 };
    const onPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer);

    const coverPlane = () => {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      const distance = camera.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
      const visibleWidth = visibleHeight * camera.aspect;
      mesh.scale.set(visibleWidth * 1.08, visibleHeight * 1.08, 1);
    };
    coverPlane();
    window.addEventListener("resize", coverPlane);

    let kenBurns: gsap.core.Tween | undefined;
    if (!reduceMotion) {
      kenBurns = gsap.to(mesh.scale, {
        x: "+=0.12",
        y: "+=0.12",
        duration: 18,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      if (!reduceMotion) {
        mesh.position.x += (pointer.x * 0.06 - mesh.position.x) * 0.03;
        mesh.position.y += (-pointer.y * 0.04 - mesh.position.y) * 0.03;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(frame);
      kenBurns?.kill();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", coverPlane);
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-[-8%] scale-110 bg-cover bg-center blur-2xl brightness-[0.55] saturate-50"
        style={{ backgroundImage: `url(${BG_URL})` }}
      />
      <div ref={hostRef} className="absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-emerald-950/55" />
    </div>
  );
}
