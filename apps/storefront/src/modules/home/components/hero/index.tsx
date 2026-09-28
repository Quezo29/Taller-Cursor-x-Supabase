"use client"

import { Button, Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

export type HeroGame = {
  handle: string
  title: string
  image: string
}

const Hero = ({ games }: { games: HeroGame[] }) => {
  const rows = toRows(games, 4)

  return (
    <div className="relative h-[75vh] w-full overflow-hidden border-b border-ui-border-base bg-ui-bg-subtle">
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 py-6">
        {rows.map((row, index) => (
          <MarqueeRow
            key={index}
            games={row}
            direction={index % 2 === 0 ? "left" : "right"}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="pointer-events-auto flex flex-col items-center gap-6 rounded-xl bg-white/80 px-10 py-8 text-center shadow-elevation-card-rest backdrop-blur-sm">
          <span>
            <Heading
              level="h1"
              className="text-3xl font-normal leading-10 text-ui-fg-base"
            >
              Quezo's Game Stache
            </Heading>
            <Heading
              level="h2"
              className="text-3xl font-normal leading-10 text-ui-fg-subtle"
            >
              Juegos físicos
            </Heading>
          </span>
          <LocalizedClientLink href="/store">
            <Button variant="secondary">Ir a la tienda</Button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

const MarqueeRow = ({
  games,
  direction,
}: {
  games: HeroGame[]
  direction: "left" | "right"
}) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [count, setCount] = useState(24)
  const sequence = repeatTo(games, count)
  const loop = [...sequence, ...sequence]
  const animationName = direction === "left" ? "marquee-left" : "marquee-right"

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track || !games.length) {
      return
    }

    const fit = () => {
      const card = track.querySelector("li")
      if (!card) {
        return
      }

      const styles = getComputedStyle(track)
      const gap = Number.parseFloat(styles.columnGap || "0") || 0
      const cardWidth = card.getBoundingClientRect().width + gap
      if (!cardWidth) {
        return
      }

      const needed = Math.ceil(viewport.clientWidth / cardWidth) + 1
      setCount((current) => (current < needed ? needed : current))
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [games.length])

  if (!loop.length) {
    return null
  }

  return (
    <div
      ref={viewportRef}
      className="overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <ul
        ref={trackRef}
        className={`flex w-max gap-4 ${animationName}`}
        style={{
          animation: `${animationName} 36s linear infinite`,
        }}
      >
        {loop.map((game, index) => (
          <li key={`${game.handle}-${index}`} className="shrink-0" aria-hidden>
            <Image
              src={game.image}
              alt=""
              width={144}
              height={192}
              className="h-32 w-24 rounded-md object-cover shadow-elevation-card-rest small:h-40 small:w-28"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function repeatTo(games: HeroGame[], count: number) {
  if (!games.length) {
    return []
  }

  const filled: HeroGame[] = []
  while (filled.length < count) {
    filled.push(...games)
  }
  return filled.slice(0, count)
}

function toRows(games: HeroGame[], rowCount: number) {
  const rows: HeroGame[][] = Array.from({ length: rowCount }, () => [])

  games.forEach((game, index) => {
    rows[index % rowCount].push(game)
  })

  return rows.map((row) => (row.length ? row : games))
}

export default Hero
