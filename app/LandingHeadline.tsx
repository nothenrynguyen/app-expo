"use client";

import { useEffect, useState } from "react";

const categories = ["software", "data", "engineering", "product", "solutions & support", "business", "finance & quant", "IT & security"];

export function LandingHeadline() {
  const [text, setText] = useState(categories[0]);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let length = categories[0].length;
    let deleting = true;
    const tick = () => {
      if (motion.matches) return;
      const word = categories[index];
      length += deleting ? -1 : 1;
      setText(word.slice(0, length));
      let delay = deleting ? 55 : 90;
      if (length === 0) { index = (index + 1) % categories.length; deleting = false; delay = 250; }
      else if (length === word.length && !deleting) { deleting = true; delay = 2000; }
      timer = setTimeout(tick, delay);
    };
    const start = () => { clearTimeout(timer); if (!motion.matches) timer = setTimeout(tick, 2000); };
    start();
    const onMotionChange = () => { if (motion.matches) setText(categories[index]); start(); };
    motion.addEventListener("change", onMotionChange);
    return () => { clearTimeout(timer); motion.removeEventListener("change", onMotionChange); };
  }, []);
  return <h1 className="landing-headline"><span className="sr-only">Search for internships or full-time roles in software, data, engineering, product, solutions and support, business, finance, quant, IT and security.</span><span aria-hidden="true" className="headline-lead">Search for</span><span aria-hidden="true" className="headline-category"><span>{text}</span><span className="type-cursor">|</span></span><span aria-hidden="true" className="headline-tail">internships or full-time roles</span></h1>;
}
