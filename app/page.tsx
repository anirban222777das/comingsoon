"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"

export default function Page() {
  // We separate "target" (where mouse is) from "current" (where animation is)
  // to create the smooth drift effect (Linear Interpolation)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  
  const [position, setPosition] = useState({ x: 0, y: 0 }) // State for React render
  const [needsPermission, setNeedsPermission] = useState(false)
  const [gyroActive, setGyroActive] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  const requestRef = useRef<number>(0)

  const requestOrientation = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission()
        if (permissionState === "granted") {
          setNeedsPermission(false)
          setGyroActive(true)
          setShouldAnimate(true)
        }
      } catch (error) {
        console.error("Permission denied:", error)
      }
    } else {
      setNeedsPermission(false)
      setGyroActive(true)
      setShouldAnimate(true)
    }
  }

  // 1. The Animation Loop (Physics Engine)
  useEffect(() => {
    const animate = () => {
      // "Lerp" logic: Move current towards target by 5% every frame
      // Lower number = smoother/slower drift (0.05). Higher = snappier (0.15)
      const ease = 0.075 
      
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * ease
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * ease

      // Update state with smoothed values
      // We round to 4 decimals to avoid React over-rendering on microscopic changes
      const x = Math.round(currentRef.current.x * 10000) / 10000
      const y = Math.round(currentRef.current.y * 10000) / 10000
      
      setPosition({ x, y })
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // 2. Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized coordinates (-1 to 1)
      const x = (e.clientX - window.innerWidth / 2) / window.innerWidth
      const y = (e.clientY - window.innerHeight / 2) / window.innerHeight
      targetRef.current = { x, y }
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const isLandscape = window.innerWidth > window.innerHeight
      let x = 0
      if (isLandscape) {
        const beta = e.beta || 0
        x = Math.max(-1, Math.min(1, beta / 45))
      } else {
        const gamma = e.gamma || 0
        x = Math.max(-1, Math.min(1, gamma / 45))
      }
      targetRef.current = { x, y: 0 }
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isTouchDevice = isMobile || "ontouchstart" in window || navigator.maxTouchPoints > 0

    if (isTouchDevice) {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        if (!gyroActive) setNeedsPermission(true)
      } else {
        if (!gyroActive) {
          setGyroActive(true)
          setShouldAnimate(true)
        }
      }
    } else {
      window.addEventListener("mousemove", handleMouseMove)
      setShouldAnimate(true)
    }

    if (gyroActive) {
      window.addEventListener("deviceorientation", handleOrientation)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("deviceorientation", handleOrientation)
    }
  }, [gyroActive])

  const text = "COMING SOON"

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black select-none font-sans">
      {needsPermission && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={requestOrientation}
            className="px-8 py-4 bg-orange-600 text-white text-xl font-bold rounded-lg hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(234,88,12,0.5)]"
          >
            Enter Experience
          </button>
        </div>
      )}

      {/* BACKGROUND (Mars) */}
      <div
        className={`absolute inset-0 ${shouldAnimate ? "zoom-layer-1" : ""}`}
        style={{
          transform: `translate3d(${position.x * 20}px, ${position.y * 20}px, 0) scale(1.1)`,
          willChange: "transform",
        }}
      >
        <Image 
          src="/images/mars-1.png" 
          alt="Mars Background" 
          fill 
          className="object-cover opacity-80" 
          priority 
          quality={90}
        />
      </div>

      {/* STARSHIP */}
      <div
        className={`absolute z-5 ${shouldAnimate ? "zoom-layer-starship" : ""}`}
        style={{
          // Moves slightly opposite to background for depth
          transform: `translate3d(${position.x * 40}px, ${position.y * 40}px, 0) scale(0.75)`,
          willChange: "transform",
          width: "800px",
          height: "800px",
          left: "20px",
          top: "20px",
        }}
      >
        <Image src="/images/starship.png" alt="Starship" fill className="object-contain" />
      </div>

      {/* WINDOW FRAME */}
      <div
        className={`absolute inset-0 z-10 ${shouldAnimate ? "zoom-layer-2" : ""}`}
        style={{
          transform: `translate3d(${position.x * 50}px, ${position.y * 50}px, 0)`,
          willChange: "transform",
          width: "120%",
          height: "120%",
          left: "-10%",
          top: "-10%",
        }}
      >
        <Image src="/images/mars-2.png" alt="Window Frame" fill className="object-cover" />
      </div>

      {/* TEXT LAYER - Highlighted & Cool */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-30 px-6 ${shouldAnimate ? "zoom-layer-text" : ""}`}
        style={{
          transform: `translate3d(${position.x * 80}px, ${position.y * 80}px, 0)`,
          willChange: "transform",
          perspective: "1000px",
        }}
      >
        <div className="flex flex-wrap justify-center gap-x-[1vw] md:gap-x-[0.5vw]">
          {text.split("").map((char, index) => (
            <span
              key={index}
              className={`
                relative font-black tracking-tighter italic
                text-[15vw] leading-none sm:text-[120px] md:text-[160px] lg:text-[180px]
                ${shouldAnimate ? "letter-reveal" : "opacity-0"}
              `}
              style={{
                display: "inline-block",
                transformStyle: "preserve-3d",
                animationDelay: `${300 + index * 60}ms`, // Staggered delay
                
                // Highlight Styling: Gradient Text + Glow
                backgroundImage: "linear-gradient(180deg, #ffffff 30%, #fb923c 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0px 0px 20px rgba(249, 115, 22, 0.6))",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>

      {/* FOREGROUND ASTRONAUT */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none ${shouldAnimate ? "zoom-layer-3" : ""}`}
        style={{
          transform: `translate3d(${position.x * 100}px, ${position.y * 100}px, 0)`,
          willChange: "transform",
          width: "110%",
          height: "110%",
          left: "-5%",
          top: "calc(-5% + 150px)",
        }}
      >
        <Image src="/images/mars-3.png" alt="Astronaut" fill className="object-cover" />
      </div>

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

      <style jsx>{`
        /* Bezier Curve: cubic-bezier(0.2, 0.8, 0.2, 1)
           This creates a "fast start, slow stop" friction feel
        */
        .zoom-layer-1 { animation: cinematicZoom 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-starship { animation: cinematicZoom 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-2 { animation: cinematicZoom 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-3 { animation: cinematicZoom 3.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-text { animation: cinematicZoom 3.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        @keyframes cinematicZoom {
          0% { scale: 1.4; opacity: 0; filter: blur(10px); }
          100% { scale: 1; opacity: 1; filter: blur(0px); }
        }

        .letter-reveal {
          animation: textFlipUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }

        /* 3D Flip Up Animation */
        @keyframes textFlipUp {
          0% {
            opacity: 0;
            transform: translate3d(0, 40px, -50px) rotateX(-90deg);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotateX(0deg);
            filter: blur(0px); /* Restores the glow filter defined inline */
          }
        }
      `}</style>
    </div>
  )
}