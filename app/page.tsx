"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"

export default function Page() {
  // --- Physics State ---
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  // --- Interaction State ---
  const [needsPermission, setNeedsPermission] = useState(false)
  const [gyroActive, setGyroActive] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [particles, setParticles] = useState<Array<{ top: string; left: string; size: string; opacity: number }>>([])
  
  const requestRef = useRef<number>(0)

  // 1. Initialize Star/Dust Particles
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      opacity: Math.random() * 0.5 + 0.3,
    }))
    setParticles(newParticles)
  }, [])

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

  // 2. Physics Engine Loop (The "Smoothness")
  useEffect(() => {
    const animate = () => {
      // Very low ease value = Heavy, Cinematic drift
      const ease = 0.05 
      
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * ease
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * ease

      const x = Math.round(currentRef.current.x * 10000) / 10000
      const y = Math.round(currentRef.current.y * 10000) / 10000
      
      setPosition({ x, y })
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // 3. Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

  const mainText = "COMING SOON"

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black select-none font-sans perspective-container">
      {needsPermission && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={requestOrientation}
            className="px-8 py-4 bg-orange-600 text-white text-xl font-bold rounded-lg hover:bg-orange-700 transition-all shadow-[0_0_30px_rgba(234,88,12,0.5)]"
          >
            Enter Experience
          </button>
        </div>
      )}

      {/* --- SCENE CONTAINER --- */}
      {/* We apply a slight 3D rotation to the whole container based on mouse position for extra depth */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `rotateX(${position.y * -4}deg) rotateY(${position.x * 4}deg)`,
          transformStyle: "preserve-3d",
        }}
      >

        {/* LAYER 1: Background Mars */}
        <div
          className={`absolute inset-0 ${shouldAnimate ? "zoom-layer-1" : ""}`}
          style={{
            transform: `translate3d(${position.x * 20}px, ${position.y * 20}px, -100px) scale(1.15)`,
          }}
        >
          <Image src="/images/mars-1.png" alt="Mars Background" fill className="object-cover opacity-80" priority quality={90} />
        </div>

        {/* LAYER: Space Dust (Particles) */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                // Parallax the dust slightly
                transform: `translate3d(${position.x * 40}px, ${position.y * 40}px, 0)`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>

        {/* LAYER: Starship */}
        {/* Wrapper handles Mouse Parallax, Inner div handles Floating Animation */}
        <div
          className={`absolute z-5 ${shouldAnimate ? "zoom-layer-starship" : ""}`}
          style={{
            transform: `translate3d(${position.x * 40}px, ${position.y * 40}px, 0) scale(0.75)`,
            width: "800px",
            height: "800px",
            left: "5%",
            top: "5%",
          }}
        >
          <div className="w-full h-full animate-float-slow">
            <Image src="/images/starship.png" alt="Starship" fill className="object-contain" />
          </div>
        </div>

        {/* LAYER 2: Window Frame */}
        <div
          className={`absolute inset-0 z-10 ${shouldAnimate ? "zoom-layer-2" : ""}`}
          style={{
            transform: `translate3d(${position.x * 50}px, ${position.y * 50}px, 50px)`,
            width: "120%",
            height: "120%",
            left: "-10%",
            top: "-10%",
          }}
        >
           <Image src="/images/mars-2.png" alt="Window Frame" fill className="object-cover" />
        </div>

        {/* LAYER: Main Text */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-30 px-6 ${shouldAnimate ? "zoom-layer-text" : ""}`}
          style={{
            transform: `translate3d(${position.x * 80}px, ${position.y * 80}px, 100px)`,
          }}
        >
          <div className="flex flex-wrap justify-center gap-x-[1vw] md:gap-x-[0.5vw]">
            {mainText.split("").map((char, index) => (
              <span
                key={index}
                className={`
                  relative font-black tracking-tighter italic
                  text-[18vw] leading-none sm:text-[130px] md:text-[180px] lg:text-[220px]
                  ${shouldAnimate ? "letter-reveal" : "opacity-0"}
                `}
                style={{
                  display: "inline-block",
                  transformStyle: "preserve-3d",
                  animationDelay: `${400 + index * 50}ms`,
                  // Advanced Gradient & Shadow
                  backgroundImage: "linear-gradient(180deg, #ffffff 20%, #fb923c 60%, #c2410c 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0px 0px 30px rgba(234, 88, 12, 0.4))",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        </div>

        {/* LAYER 3: Foreground Astronaut */}
        <div
          className={`absolute inset-0 z-20 pointer-events-none ${shouldAnimate ? "zoom-layer-3" : ""}`}
          style={{
            transform: `translate3d(${position.x * 100}px, ${position.y * 100}px, 150px)`,
            width: "110%",
            height: "110%",
            left: "-5%",
            top: "calc(-5% + 150px)",
          }}
        >
           <div className="w-full h-full animate-float-medium">
            <Image src="/images/mars-3.png" alt="Astronaut" fill className="object-cover" />
          </div>
        </div>
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.9)_100%)]" />
      {/* Scanline Effect */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[url('/scanlines.png')] opacity-[0.03] bg-repeat mix-blend-overlay" />

      <style jsx>{`
        .perspective-container {
          perspective: 1200px;
        }

        /* --- Intro Zooms --- */
        .zoom-layer-1 { animation: cinematicZoom 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-starship { animation: cinematicZoom 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-2 { animation: cinematicZoom 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-3 { animation: cinematicZoom 3.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .zoom-layer-text { animation: cinematicZoom 3.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        @keyframes cinematicZoom {
          0% { scale: 1.4; opacity: 0; filter: blur(20px); }
          100% { scale: 1; opacity: 1; filter: blur(0px); }
        }

        /* --- Text Reveal --- */
        .letter-reveal {
          animation: textFlipUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) backwards,
                     textBreathing 6s ease-in-out infinite alternate 2s; /* Breathing starts after 2s */
        }

        @keyframes textFlipUp {
          0% {
            opacity: 0;
            transform: rotateX(-90deg) translateY(50px) scale(0.8);
            filter: blur(15px);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes textBreathing {
          0% { transform: scale(1); letter-spacing: 0em; filter: drop-shadow(0px 0px 30px rgba(234, 88, 12, 0.4)); }
          100% { transform: scale(1.02); letter-spacing: 0.02em; filter: drop-shadow(0px 0px 50px rgba(234, 88, 12, 0.7)); }
        }

        /* --- Floating "Zero-G" Animations --- */
        /* These run continuously, independent of mouse movement */
        
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float 6s ease-in-out infinite reverse; /* Reverse makes astronaut float opposite to ship */
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* --- Particle Twinkle --- */
        .animate-twinkle {
          animation: twinkle 4s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}