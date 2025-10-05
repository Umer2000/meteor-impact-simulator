import React, { useRef, useEffect, useState } from "react";

const App = () => {
  const bgCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  // useRef for simulation arrays (won’t trigger re-renders)
  const meteorsRef = useRef([]);
  const explosionsRef = useRef([]);
  const impactsRef = useRef([]);

  const [running, setRunning] = useState(true);
  const meteorIntervalRef = useRef(null);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const bgCtx = bgCanvas.getContext("2d");
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext("2d");

    const width = window.innerWidth;
    const height = window.innerHeight;
    bgCanvas.width = overlayCanvas.width = width;
    bgCanvas.height = overlayCanvas.height = height;

    // World map background
    const bg = new Image();
    bg.src = "/world-map.png";
    bg.onload = () => {
      bgCtx.drawImage(bg, 0, 0, width, height);
    };

    // Preload meteors
    meteorsRef.current = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * 0.8 * height,
      vx: Math.random() * 2 - 1,
      vy: 2 + Math.random() * 3,
      radius: 5 + Math.random() * 3,
    }));

    const createMeteor = () => {
      if (!running) return;
      meteorsRef.current.push({
        x: Math.random() * width,
        y: 0,
        vx: Math.random() * 2 - 1,
        vy: 2 + Math.random() * 3,
        radius: 5 + Math.random() * 3,
      });
    };

    const createExplosion = (x, y) => {
      impactsRef.current.push({ x, y });
      const particles = [];
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 5 + 2,
          opacity: 1,
          life: 0,
          color: { r: 255, g: 200, b: 0 },
        });
      }
      explosionsRef.current.push({ particles });
    };

    const getExplosionColor = (life) => {
      if (life < 5) return { r: 255, g: 200, b: 0 };
      if (life < 10) return { r: 255, g: 100, b: 0 };
      if (life < 20) return { r: 200, g: 0, b: 0 };
      return { r: 120, g: 0, b: 50 };
    };

    const drawHeatmap = () => {
      const impacts = impactsRef.current;
      impacts.forEach((impact) => {
        const gradient = ctx.createRadialGradient(
          impact.x,
          impact.y,
          0,
          impact.x,
          impact.y,
          50
        );
        gradient.addColorStop(0, "rgba(255,0,0,0.6)");
        gradient.addColorStop(0.5, "rgba(255,165,0,0.4)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(impact.x, impact.y, 50, 0, Math.PI * 2);
        ctx.fill();
      });

      // Heatmap legend
      const legendX = 20;
      const legendY = 20;
      const legendWidth = 20;
      const legendHeight = 100;
      const legendGradient = ctx.createLinearGradient(
        0,
        legendY,
        0,
        legendY + legendHeight
      );
      legendGradient.addColorStop(0, "red");
      legendGradient.addColorStop(0.5, "orange");
      legendGradient.addColorStop(1, "green");
      ctx.fillStyle = legendGradient;
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText("High", legendX + 30, legendY + 10);
      ctx.fillText("Medium", legendX + 30, legendY + 55);
      ctx.fillText("Low", legendX + 30, legendY + 105);
      ctx.fillStyle = "white";
      ctx.font = "18px Arial";
      ctx.fillText(
        `Total Impacts: ${impacts.length}`,
        legendX,
        legendY + legendHeight + 40
      );

      // Future risk heatmap
      const gridSize = 50;
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);
      const futureRisk = Array(cols)
        .fill(0)
        .map(() => Array(rows).fill(0));

      impacts.forEach(({ x, y }) => {
        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);
        if (futureRisk[gx] && futureRisk[gx][gy] !== undefined)
          futureRisk[gx][gy] += 1;
      });

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const val = futureRisk[i][j];
          if (val > 0) {
            ctx.fillStyle = `rgba(255,0,0,${Math.min(val / 5, 0.5)})`;
            ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
          }
        }
      }
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      if (running) {
        meteorsRef.current = meteorsRef.current.flatMap((m) => {
          if (!m) return [];
          const newMeteor = { ...m, x: m.x + m.vx, y: m.y + m.vy };
          if (newMeteor.y > height * 0.8) {
            createExplosion(newMeteor.x, newMeteor.y);
            return [];
          }
          return [newMeteor];
        });
      }

      meteorsRef.current.forEach((m) => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
      });

      explosionsRef.current = explosionsRef.current.flatMap((expl) => {
        expl.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.radius *= 0.96;
          p.opacity *= 0.96;
          p.color = getExplosionColor(p.life);
          p.life += 1;
        });
        const alive = expl.particles.filter((p) => p.opacity > 0.05);
        return alive.length > 0 ? [{ ...expl, particles: alive }] : [];
      });

      explosionsRef.current.forEach((expl) => {
        expl.particles.forEach((p) => {
          const gradient = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            p.radius
          );
          gradient.addColorStop(
            0,
            `rgba(${p.color.r},${p.color.g},${p.color.b},${p.opacity})`
          );
          gradient.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      drawHeatmap();
      requestAnimationFrame(update);
    };

    meteorIntervalRef.current = setInterval(createMeteor, 500);
    update();

    return () => clearInterval(meteorIntervalRef.current);
  }, [running]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    meteorsRef.current = [];
    explosionsRef.current = [];
    impactsRef.current = [];
  };

  const buttonStyle = {
    padding: "8px 16px",
    margin: "5px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const buttonHover = {
    backgroundColor: "rgba(255,255,255,0.6)",
    color: "black",
  };

  return (
    <>
      <canvas
        ref={bgCanvasRef}
        style={{ display: "block", position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{ display: "block", position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        {["Start", "Pause", "Reset"].map((label, idx) => {
          const onClick =
            label === "Start"
              ? handleStart
              : label === "Pause"
              ? handlePause
              : handleReset;
          return (
            <button
              key={idx}
              onClick={onClick}
              style={buttonStyle}
              onMouseEnter={(e) => Object.assign(e.target.style, buttonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default App;
