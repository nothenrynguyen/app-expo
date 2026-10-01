"use client";

import { useEffect, useRef } from "react";

export function HeroGravity() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const hero = surface?.parentElement;
    const context = surface?.getContext("2d");
    if (!surface || !hero || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let x = 0;
    let y = 0;
    let strength = 0;
    let target = 0;
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const project = (px: number, py: number) => {
        const dx = x - px;
        const dy = y - py;
        const distance = Math.hypot(dx, dy);
        const pull = Math.exp(-(distance * distance) / (150 * 150)) * strength;
        return [px + dx * .18 * pull, py + dy * .18 * pull + 24 * pull];
      };
      context.fillStyle = "rgba(176, 139, 255, 0.32)";
      context.beginPath();
      for (let col = 14; col < width; col += 28) {
        for (let row = 14; row < height; row += 28) {
          const [px, py] = project(col, row);
          context.moveTo(px + 1, py);
          context.arc(px, py, 1, 0, Math.PI * 2);
        }
      }
      context.fill();
    };
    const animate = () => {
      strength += (target - strength) * .1;
      if (Math.abs(target - strength) < .002) strength = target;
      draw();
      frame = strength !== target ? requestAnimationFrame(animate) : 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType !== "mouse") return;
      const bounds = hero.getBoundingClientRect();
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      target = 1;
      schedule();
    };
    const leave = () => { target = 0; schedule(); };
    const resize = () => {
      width = hero.clientWidth; height = hero.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * scale); surface.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      draw();
    };
    const preference = () => { cancelAnimationFrame(frame); frame = 0; target = 0; strength = 0; draw(); };
    const observer = new ResizeObserver(resize);
    observer.observe(hero);
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    motion.addEventListener("change", preference);
    pointer.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave);
      motion.removeEventListener("change", preference); pointer.removeEventListener("change", preference);
    };
  }, []);
  return <canvas ref={canvas} className="hero-gravity" aria-hidden="true" />;
}
