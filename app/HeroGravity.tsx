"use client";

import { useEffect, useRef } from "react";

export function HeroGravity({ variant = "hero" }: { variant?: "hero" | "board" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const hero = surface?.parentElement;
    const context = surface?.getContext("2d");
    if (!surface || !hero || !context) return;
    const interactionArea = hero.closest(variant === "hero" ? "main" : "body") ?? hero;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let x = 0;
    let y = 0;
    let strength = 0;
    let target = 0;
    let ripples: { x: number; y: number; started: number }[] = [];
    const rippleDuration = 1100;
    const radius = variant === "board" ? 300 : 150;
    const pullAmount = variant === "board" ? .11 : .18;
    const draw = () => {
      const now = performance.now();
      context.clearRect(0, 0, width, height);
      const project = (px: number, py: number) => {
        const dx = x - px;
        const dy = y - py;
        const distance = Math.hypot(dx, dy);
        const pull = Math.exp(-(distance * distance) / (radius * radius)) * strength;
        let projectedX = px + dx * pullAmount * pull;
        let projectedY = py + dy * pullAmount * pull + 24 * pull;
        for (const ripple of ripples) {
          const age = Math.min((now - ripple.started) / rippleDuration, 1);
          const rx = px - ripple.x;
          const ry = py - ripple.y;
          const distance = Math.hypot(rx, ry);
          const ringDistance = distance - age * 520;
          const wave = Math.exp(-(ringDistance * ringDistance) / (38 * 38)) * Math.sin(ringDistance / 20) * 12 * (1 - age) ** 2;
          if (distance > 0) {
            projectedX += rx / distance * wave;
            projectedY += ry / distance * wave;
          }
        }
        return [projectedX, projectedY];
      };
      context.fillStyle = variant === "board" ? "rgba(176, 139, 255, 0.24)" : "rgba(176, 139, 255, 0.32)";
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
      ripples = ripples.filter(ripple => performance.now() - ripple.started < rippleDuration);
      strength += (target - strength) * .1;
      if (Math.abs(target - strength) < .002) strength = target;
      draw();
      frame = strength !== target || ripples.length > 0 ? requestAnimationFrame(animate) : 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType !== "mouse") return;
      const bounds = surface.getBoundingClientRect();
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      target = x >= 0 && x <= width && y >= 0 && y <= height ? 1 : 0;
      schedule();
    };
    const leave = () => { target = 0; schedule(); };
    const click = (event: MouseEvent) => {
      if (motion.matches || event.button !== 0 || event.detail === 0) return;
      const clicked = event.target;
      if (!(clicked instanceof Element) || clicked.closest('a,button,input,select,textarea,label,summary,[role="button"],[role="checkbox"],.filters,.job-card,table')) return;
      const bounds = surface.getBoundingClientRect();
      const rippleX = event.clientX - bounds.left;
      const rippleY = event.clientY - bounds.top;
      if (rippleX < 0 || rippleX > width || rippleY < 0 || rippleY > height) return;
      ripples = [...ripples.slice(-3), { x: rippleX, y: rippleY, started: performance.now() }];
      schedule();
    };
    const resize = () => {
      width = surface.clientWidth; height = surface.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * scale); surface.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      draw();
    };
    const preference = () => { cancelAnimationFrame(frame); frame = 0; target = 0; strength = 0; ripples = []; draw(); };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    interactionArea.addEventListener("pointermove", move);
    interactionArea.addEventListener("pointerleave", leave);
    interactionArea.addEventListener("click", click);
    motion.addEventListener("change", preference);
    pointer.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      interactionArea.removeEventListener("pointermove", move); interactionArea.removeEventListener("pointerleave", leave);
      interactionArea.removeEventListener("click", click);
      motion.removeEventListener("change", preference); pointer.removeEventListener("change", preference);
    };
  }, [variant]);
  return <canvas ref={canvas} className={`hero-gravity${variant === "board" ? " board-gravity" : ""}`} aria-hidden="true" />;
}
