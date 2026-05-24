import { useState, useEffect } from "react"
import { Logo } from "@/components/Logo"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [splashVisible, setSplashVisible] = useState(false)
  const [splashFade, setSplashFade] = useState(false)

  useEffect(() => {
    // Softly fade in the splash screen overlay immediately after mounting
    const introTimer = setTimeout(() => {
      setSplashVisible(true)
    }, 40)

    // Start fading out after 1.4s (giving a peaceful, gentle viewing period)
    const fadeTimer = setTimeout(() => {
      setSplashFade(true)
    }, 1400)

    // Unmount after 2.1s (allowing 700ms for a luxurious and soft CSS transition)
    const removeTimer = setTimeout(() => {
      onComplete()
    }, 2100)

    return () => {
      clearTimeout(introTimer)
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-amber-50/90 via-white to-orange-50/90 text-slate-900 transition-all duration-700 ease-in-out dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white ${
        !splashVisible
          ? "scale-95 opacity-0"
          : splashFade
            ? "pointer-events-none scale-105 opacity-0"
            : "scale-100 opacity-100"
      }`}
    >
      <div className="flex animate-pulse flex-col items-center gap-6">
        <Logo
          iconSize={128}
          showText={false}
          usePng={true}
          className="drop-shadow-lg"
        />
        <div className="flex flex-col items-center text-center">
          <h1 className="font-sans text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Cardo
          </h1>
          <p className="mt-2 text-xs font-bold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
            Jerusalem Mapping Playground
          </p>
        </div>
      </div>
    </div>
  )
}
