import { useRef, useState } from 'react'

export function useSound() {
  const [enabled, setEnabled] = useState(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const start = async () => {
    const AC: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    if (!audioCtxRef.current) audioCtxRef.current = new AC()
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const beep = async (freq = 500, durationMs = 120, type: OscillatorType = 'sine', volume = 0.05) => {
    if (!enabled) return
    const ctx = await start()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000)
  }

  const playSuccess = () => {
    beep(700, 100, 'triangle', 0.05)
    setTimeout(() => beep(900, 130, 'triangle', 0.05), 110)
  }

  const playError = () => {
    beep(160, 220, 'square', 0.06)
  }

  const playClick = () => {
    beep(1200, 40, 'sine', 0.03)
  }

  return { enabled, setEnabled, playSuccess, playError, playClick }
}