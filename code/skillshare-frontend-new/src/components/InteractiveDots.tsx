import { useEffect, useRef } from "react";

export const InteractiveDots = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const SPACING = 28;
    const RADIUS = 1.5;
    const MOUSE_RADIUS = 120;
    
    // Check dark mode for base dot color
    const isDark = document.documentElement.classList.contains("dark");
    // Base dot color: slightly visible
    const baseColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    const highlightColor = isDark ? "rgba(37, 99, 235, 0.5)" : "rgba(37, 99, 235, 0.4)"; // Primary blue hint

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY + window.scrollY; // Adjust for scrolling
    };
    
    // For scroll
    const handleScroll = () => {
      // We don't track mouse coords perfectly on scroll without e.clientX, 
      // but we can just quickly dismiss the effect
      targetMouseY = -1000;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight; // Actually Landing Hero height might differ, but full screen is safe
      canvas.width = width;
      canvas.height = document.documentElement.scrollHeight || height;
      draw(true); // Force redraw
    };

    // Only add listeners if not reduced motion and not touch device
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (!prefersReduced && !isTouch) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("resize", handleResize, { passive: true });

    let animationId: number;

    const draw = (forceStatic = false) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lerp mouse for smooth following
      mouseX += (targetMouseX - mouseX) * 0.15;
      mouseY += (targetMouseY - mouseY) * 0.15;

      const cols = Math.floor(canvas.width / SPACING) + 1;
      const rows = Math.floor(canvas.height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          let r = RADIUS;
          let color = baseColor;
          let dx = 0;
          let dy = 0;

          if (!forceStatic && !prefersReduced && !isTouch) {
            const distX = x - mouseX;
            const distY = y - mouseY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < MOUSE_RADIUS) {
              const factor = 1 - distance / MOUSE_RADIUS; // 0 to 1
              // Slight push away
              const push = factor * 4;
              const angle = Math.atan2(distY, distX);
              dx = Math.cos(angle) * push;
              dy = Math.sin(angle) * push;
              
              // Slight size increase
              r = RADIUS + factor * 1.5;

              // Color mix (opacity increase + blue tint)
              const alphaBase = isDark ? 0.08 : 0.06;
              const alphaHigh = isDark ? 0.5 : 0.4;
              const a = alphaBase + (alphaHigh - alphaBase) * factor;
              
              color = isDark 
                ? `rgba(${255 - factor*218}, ${255 - factor*156}, ${255}, ${a})` 
                : `rgba(${factor*37}, ${factor*99}, ${factor*235}, ${a})`;
            }
          }

          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      if (!prefersReduced && !isTouch && !forceStatic) {
        animationId = requestAnimationFrame(() => draw(false));
      }
    };

    draw(prefersReduced || isTouch);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 opacity-70"
      aria-hidden="true"
    />
  );
};
