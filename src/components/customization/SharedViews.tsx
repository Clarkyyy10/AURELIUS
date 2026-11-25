"use client";

// Many small 3D viewers (product cards) drawn by ONE WebGL canvas using drei's <View>.
// Browsers allow only ~16 WebGL contexts, and one canvas per card would also be slow.
// The canvas is fixed over the page with pointer-events off; each card's <View> element receives
// the drag/zoom gestures, and only the cards on screen are drawn.

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import type { CustomizationOptions, DesignConfig } from "@/types";
import { JewelryScene } from "./JewelryScene";
import { usePrefersReducedMotion, useWebGL } from "./webgl";

/** Render once per page that shows product viewers. */
export function SharedViewCanvas() {
  const webgl = useWebGL();
  if (!webgl) return null;
  return (
    <Canvas
      className="pointer-events-none"
      style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none" }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <View.Port />
    </Canvas>
  );
}

/**
 * A rotatable 3D model inside a product card.
 * - Mouse: drag to rotate right away; click once to also turn on scroll-to-zoom (so the page still scrolls).
 * - Touch: tap once to turn on rotate and pinch-zoom (so swiping still scrolls the page).
 * Moving away (or tapping elsewhere) turns zoom off again.
 */
export function ProductModelView({
  config,
  options,
  className,
  label,
}: {
  config: DesignConfig;
  options: CustomizationOptions;
  className?: string;
  label: string;
}) {
  const reduced = usePrefersReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!active) return;
    const off = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setActive(false);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [active]);

  return (
    <div
      ref={wrap}
      className={cn("relative overflow-hidden bg-grey-100 select-none", className)}
      role="img"
      aria-label={label}
      onPointerDown={() => setActive(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActive(false)}
    >
      <View className={cn("absolute inset-0", active ? "touch-none" : "touch-pan-y")}>
        <JewelryScene config={config} options={options} autoRotate={!reduced && !touched} enableZoom={active} onInteract={() => setTouched(true)} />
      </View>
      {/* On touch screens a transparent cover keeps swipes scrolling the page until the model is tapped. */}
      {!active && (
        <button
          type="button"
          aria-label={`Rotate and zoom ${label}`}
          className="absolute inset-0 hidden cursor-grab pointer-coarse:block"
          onClick={() => setActive(true)}
        />
      )}
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-sm bg-paper/85 px-2.5 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
        {active ? (
          "Drag to rotate · scroll or pinch to zoom"
        ) : (
          <>
            <span className="pointer-coarse:hidden">Drag to rotate · click to zoom</span>
            <span className="hidden pointer-coarse:inline">Tap to rotate and zoom</span>
          </>
        )}
      </p>
    </div>
  );
}
