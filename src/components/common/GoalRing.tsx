import { useState, useEffect, useRef } from 'react'

interface GoalRingProps {
  title: string
  value: number
  goal: number
  unit: string
  color: string
  bonusGoal?: number
  bonusLabel?: string
  onStart: () => void
}

function useCountUp(value: number, durationMs = 500): number {
  const [displayed, setDisplayed] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    let frame = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - (1 - t) * (1 - t)
      const next = Math.round(from + (value - from) * eased)
      setDisplayed(next)
      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, value])
  return displayed
}

export function GoalRing({
  title,
  value,
  goal,
  unit,
  color,
  bonusGoal,
  bonusLabel,
  onStart,
}: GoalRingProps) {
  const displayedValue = useCountUp(value)
  const r = 38
  const circumference = 2 * Math.PI * r

  const primaryFraction = goal > 0 ? Math.min(1, value / goal) : 0
  const primaryDashoffset = circumference * (1 - primaryFraction)

  const bonusFraction = bonusGoal && bonusGoal > goal
    ? Math.min(1, Math.max(0, value - goal) / (bonusGoal - goal))
    : 0
  const bonusDashoffset = circumference * (1 - bonusFraction)
  const bonusOpacity = bonusGoal ? 0.2 + bonusFraction * 0.6 : 0

  const complete = goal > 0 && value >= goal
  const bonusComplete = bonusGoal && value >= bonusGoal

  return (
    <button
      type="button"
      className={`goal-ring${complete ? ' goal-ring-complete' : ''}${bonusComplete ? ' goal-ring-bonus-complete' : ''}`}
      onClick={onStart}
      aria-label={`${title}: ${value} of ${goal} ${unit}. Tap to start.`}
    >
      <p className="goal-ring-title">{title}</p>
      <svg className="goal-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="goal-ring-track" />
        <circle
          cx="50" cy="50" r={r}
          className="goal-ring-fill"
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: primaryDashoffset,
            filter: complete ? `drop-shadow(0 0 8px ${color})` : undefined,
          }}
        />
        {bonusGoal && complete && !bonusComplete && (
          <circle
            cx="50" cy="50" r={r + 3}
            className="goal-ring-bonus"
            style={{
              stroke: color,
              strokeDasharray: circumference,
              strokeDashoffset: bonusDashoffset,
              opacity: bonusOpacity,
            }}
          />
        )}
        <text x="50" y="46" className="goal-ring-count">{displayedValue}</text>
        <text x="50" y="60" className="goal-ring-label">
          {bonusComplete && bonusLabel ? bonusLabel : `of ${goal} ${unit}`}
        </text>
      </svg>
      <p className="goal-ring-total">
        {bonusComplete ? 'Maxed out!' :
         complete ? `${value} of ${bonusGoal ?? goal} ${unit}` :
         `${Math.round(primaryFraction * 100)}% of daily goal`}
      </p>
    </button>
  )
}
