/**
 * Fills every product category to exactly 5 published physical games.
 *
 *   pnpm exec medusa exec ./src/scripts/fill-console-games.ts
 *
 * Creates original SVG catalog placeholders (front, back, media, manual)
 * under apps/backend/static and skips handles that already exist.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

const SALES_CHANNEL_ID = "sc_01M3K1WSANX60FYPRQGSFDHKT9"
const REGION_EC = "reg_01M3K2QY83DKD3BHA5A20S3NAD"
const REGION_EU = "reg_01M3K1WXVV0PV193SSBF7J071J"
const TARGET_PER_CATEGORY = 5
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

type MediaKind = "disc" | "cartridge"

type GameSeed = {
  title: string
  handle: string
  description: string
  usd: number
  eur: number
  accent: string
  ink: string
  media: MediaKind
}

const CATALOG: Record<string, GameSeed[]> = {
  "play-station-1": [
    {
      title: "Final Fantasy VII",
      handle: "final-fantasy-vii",
      description:
        "RPG japonés de 1997 para PlayStation. Edición física usada con caja, disco y manual.",
      usd: 90,
      eur: 80,
      accent: "#4B7BEC",
      ink: "#0F172A",
      media: "disc",
    },
    {
      title: "Resident Evil 2",
      handle: "resident-evil-2",
      description:
        "Survival horror de Capcom para PlayStation. Edición física con caja, disco y manual.",
      usd: 75,
      eur: 65,
      accent: "#B91C1C",
      ink: "#1C1917",
      media: "disc",
    },
    {
      title: "Crash Bandicoot",
      handle: "crash-bandicoot",
      description:
        "Plataformas de Naughty Dog para PlayStation. Edición física con caja, disco y manual.",
      usd: 55,
      eur: 45,
      accent: "#F59E0B",
      ink: "#1E3A5F",
      media: "disc",
    },
    {
      title: "Spyro the Dragon",
      handle: "spyro-the-dragon",
      description:
        "Aventura de plataformas para PlayStation. Edición física con caja, disco y manual.",
      usd: 50,
      eur: 40,
      accent: "#A855F7",
      ink: "#1F1633",
      media: "disc",
    },
    {
      title: "Tekken 3",
      handle: "tekken-3",
      description:
        "Juego de lucha 3D para PlayStation. Edición física con caja, disco y manual.",
      usd: 60,
      eur: 50,
      accent: "#EF4444",
      ink: "#111827",
      media: "disc",
    },
  ],
  "nintendo-64": [
    {
      title: "GoldenEye 007",
      handle: "goldeneye-007",
      description:
        "Disparos en primera persona para Nintendo 64. Edición física con caja, cartucho y manual.",
      usd: 110,
      eur: 95,
      accent: "#CA8A04",
      ink: "#111827",
      media: "cartridge",
    },
    {
      title: "Banjo-Kazooie",
      handle: "banjo-kazooie",
      description:
        "Plataformas 3D de Rare para Nintendo 64. Edición física con caja, cartucho y manual.",
      usd: 95,
      eur: 85,
      accent: "#FBBF24",
      ink: "#1E3A8A",
      media: "cartridge",
    },
    {
      title: "Star Fox 64",
      handle: "star-fox-64",
      description:
        "Shooter on-rails para Nintendo 64. Edición física con caja, cartucho y manual.",
      usd: 80,
      eur: 70,
      accent: "#22C55E",
      ink: "#0F172A",
      media: "cartridge",
    },
    {
      title: "Paper Mario",
      handle: "paper-mario",
      description:
        "RPG de Mario para Nintendo 64. Edición física con caja, cartucho y manual.",
      usd: 130,
      eur: 115,
      accent: "#DC2626",
      ink: "#1E293B",
      media: "cartridge",
    },
    {
      title: "Perfect Dark",
      handle: "perfect-dark",
      description:
        "Shooter de Rare para Nintendo 64. Edición física con caja, cartucho y manual.",
      usd: 100,
      eur: 90,
      accent: "#0EA5E9",
      ink: "#0B1220",
      media: "cartridge",
    },
  ],
  "play-station-2": [
    {
      title: "Shadow of the Colossus",
      handle: "shadow-of-the-colossus",
      description:
        "Aventura de Team Ico para PlayStation 2. Edición física con caja, disco y manual.",
      usd: 70,
      eur: 60,
      accent: "#64748B",
      ink: "#0F172A",
      media: "disc",
    },
    {
      title: "Kingdom Hearts",
      handle: "kingdom-hearts",
      description:
        "Acción y RPG de Square Enix para PlayStation 2. Edición física con caja, disco y manual.",
      usd: 55,
      eur: 45,
      accent: "#38BDF8",
      ink: "#0C4A6E",
      media: "disc",
    },
    {
      title: "Metal Gear Solid 2: Sons of Liberty",
      handle: "metal-gear-solid-2",
      description:
        "Stealth de Hideo Kojima para PlayStation 2. Edición física con caja, disco y manual.",
      usd: 45,
      eur: 40,
      accent: "#94A3B8",
      ink: "#111827",
      media: "disc",
    },
    {
      title: "Devil May Cry",
      handle: "devil-may-cry",
      description:
        "Acción de Capcom para PlayStation 2. Edición física con caja, disco y manual.",
      usd: 50,
      eur: 45,
      accent: "#EF4444",
      ink: "#1F2937",
      media: "disc",
    },
    {
      title: "Ico",
      handle: "ico",
      description:
        "Aventura artística para PlayStation 2. Edición física con caja, disco y manual.",
      usd: 85,
      eur: 75,
      accent: "#FCD34D",
      ink: "#422006",
      media: "disc",
    },
  ],
  wii: [
    {
      title: "Super Mario Galaxy",
      handle: "super-mario-galaxy",
      description:
        "Plataformas espaciales para Wii. Edición física con caja, disco y manual.",
      usd: 55,
      eur: 45,
      accent: "#3B82F6",
      ink: "#0F172A",
      media: "disc",
    },
    {
      title: "Wii Sports",
      handle: "wii-sports",
      description:
        "Compilación deportiva para Wii. Edición física con caja, disco y manual.",
      usd: 35,
      eur: 30,
      accent: "#22C55E",
      ink: "#14532D",
      media: "disc",
    },
    {
      title: "The Legend of Zelda: Twilight Princess",
      handle: "zelda-twilight-princess",
      description:
        "Aventura de acción para Wii. Edición física con caja, disco y manual.",
      usd: 60,
      eur: 50,
      accent: "#A16207",
      ink: "#1C1917",
      media: "disc",
    },
    {
      title: "Mario Kart Wii",
      handle: "mario-kart-wii",
      description:
        "Carreras arcade para Wii. Edición física con caja, disco y manual.",
      usd: 45,
      eur: 40,
      accent: "#F59E0B",
      ink: "#1E3A8A",
      media: "disc",
    },
    {
      title: "Super Smash Bros. Brawl",
      handle: "super-smash-bros-brawl",
      description:
        "Lucha crossover para Wii. Edición física con caja, disco y manual.",
      usd: 50,
      eur: 45,
      accent: "#EF4444",
      ink: "#111827",
      media: "disc",
    },
  ],
  xbox: [
    {
      title: "Halo: Combat Evolved",
      handle: "halo-combat-evolved",
      description:
        "Shooter de Bungie para Xbox. Edición física con caja, disco y manual.",
      usd: 40,
      eur: 35,
      accent: "#86EFAC",
      ink: "#052E16",
      media: "disc",
    },
    {
      title: "Fable",
      handle: "fable",
      description:
        "RPG de acción de Lionhead para Xbox. Edición física con caja, disco y manual.",
      usd: 35,
      eur: 30,
      accent: "#FBBF24",
      ink: "#422006",
      media: "disc",
    },
    {
      title: "Ninja Gaiden",
      handle: "ninja-gaiden",
      description:
        "Acción de Team Ninja para Xbox. Edición física con caja, disco y manual.",
      usd: 45,
      eur: 40,
      accent: "#DC2626",
      ink: "#111827",
      media: "disc",
    },
    {
      title: "Dead or Alive 3",
      handle: "dead-or-alive-3",
      description:
        "Juego de lucha para Xbox. Edición física con caja, disco y manual.",
      usd: 30,
      eur: 25,
      accent: "#FB7185",
      ink: "#1F2937",
      media: "disc",
    },
    {
      title: "Panzer Dragoon Orta",
      handle: "panzer-dragoon-orta",
      description:
        "Rail shooter de Sega para Xbox. Edición física con caja, disco y manual.",
      usd: 80,
      eur: 70,
      accent: "#38BDF8",
      ink: "#0C4A6E",
      media: "disc",
    },
  ],
  "play-station-3": [
    {
      title: "The Last of Us",
      handle: "the-last-of-us",
      description:
        "Aventura de supervivencia para PlayStation 3. Edición física con caja, disco y manual.",
      usd: 40,
      eur: 35,
      accent: "#A3E635",
      ink: "#1A2E05",
      media: "disc",
    },
    {
      title: "Uncharted 2: Among Thieves",
      handle: "uncharted-2-among-thieves",
      description:
        "Aventura de acción para PlayStation 3. Edición física con caja, disco y manual.",
      usd: 30,
      eur: 25,
      accent: "#F97316",
      ink: "#1C1917",
      media: "disc",
    },
    {
      title: "Heavy Rain",
      handle: "heavy-rain",
      description:
        "Drama interactivo para PlayStation 3. Edición física con caja, disco y manual.",
      usd: 25,
      eur: 20,
      accent: "#64748B",
      ink: "#0F172A",
      media: "disc",
    },
    {
      title: "Demon's Souls",
      handle: "demons-souls",
      description:
        "Action RPG desafiante para PlayStation 3. Edición física con caja, disco y manual.",
      usd: 55,
      eur: 45,
      accent: "#B91C1C",
      ink: "#111827",
      media: "disc",
    },
    {
      title: "Metal Gear Solid 4: Guns of the Patriots",
      handle: "metal-gear-solid-4",
      description:
        "Stealth cinematográfico para PlayStation 3. Edición física con caja, disco y manual.",
      usd: 35,
      eur: 30,
      accent: "#94A3B8",
      ink: "#111827",
      media: "disc",
    },
  ],
  "xbox-360": [
    {
      title: "Gears of War",
      handle: "gears-of-war",
      description:
        "Shooter en tercera persona para Xbox 360. Edición física con caja, disco y manual.",
      usd: 25,
      eur: 20,
      accent: "#D4D4D8",
      ink: "#3F0D12",
      media: "disc",
    },
    {
      title: "Halo 3",
      handle: "halo-3",
      description:
        "Shooter de Bungie para Xbox 360. Edición física con caja, disco y manual.",
      usd: 30,
      eur: 25,
      accent: "#4ADE80",
      ink: "#052E16",
      media: "disc",
    },
    {
      title: "Forza Motorsport 3",
      handle: "forza-motorsport-3",
      description:
        "Simulación de carreras para Xbox 360. Edición física con caja, disco y manual.",
      usd: 25,
      eur: 20,
      accent: "#F97316",
      ink: "#1E293B",
      media: "disc",
    },
    {
      title: "BioShock",
      handle: "bioshock",
      description:
        "Shooter narrativo en Rapture para Xbox 360. Edición física con caja, disco y manual.",
      usd: 30,
      eur: 25,
      accent: "#38BDF8",
      ink: "#0C4A6E",
      media: "disc",
    },
    {
      title: "Red Dead Redemption",
      handle: "red-dead-redemption",
      description:
        "Western de Rockstar para Xbox 360. Edición física con caja, disco y manual.",
      usd: 35,
      eur: 30,
      accent: "#B45309",
      ink: "#1C1917",
      media: "disc",
    },
  ],
  "super-nintendo": [
    {
      title: "Super Mario World",
      handle: "super-mario-world",
      description:
        "Plataformas clásico para Super Nintendo. Edición física con caja, cartucho y manual.",
      usd: 70,
      eur: 60,
      accent: "#22C55E",
      ink: "#14532D",
      media: "cartridge",
    },
    {
      title: "The Legend of Zelda: A Link to the Past",
      handle: "zelda-a-link-to-the-past",
      description:
        "Aventura de acción para Super Nintendo. Edición física con caja, cartucho y manual.",
      usd: 90,
      eur: 80,
      accent: "#CA8A04",
      ink: "#1C1917",
      media: "cartridge",
    },
    {
      title: "Super Metroid",
      handle: "super-metroid",
      description:
        "Aventura espacial de Nintendo para Super Nintendo. Edición física con caja, cartucho y manual.",
      usd: 110,
      eur: 95,
      accent: "#A855F7",
      ink: "#1E1B4B",
      media: "cartridge",
    },
    {
      title: "Chrono Trigger",
      handle: "chrono-trigger",
      description:
        "RPG de Square para Super Nintendo. Edición física con caja, cartucho y manual.",
      usd: 150,
      eur: 130,
      accent: "#38BDF8",
      ink: "#0C4A6E",
      media: "cartridge",
    },
    {
      title: "Donkey Kong Country",
      handle: "donkey-kong-country",
      description:
        "Plataformas de Rare para Super Nintendo. Edición física con caja, cartucho y manual.",
      usd: 65,
      eur: 55,
      accent: "#F59E0B",
      ink: "#422006",
      media: "cartridge",
    },
  ],
  "game-cube": [
    {
      title: "Pikmin",
      handle: "pikmin",
      description:
        "Estrategia en tiempo real para GameCube. Edición física con caja, disco y manual.",
      usd: 55,
      eur: 45,
      accent: "#84CC16",
      ink: "#1A2E05",
      media: "disc",
    },
  ],
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function wrapTitle(title: string, max = 18) {
  const words = title.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > max && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 4)
}

function writeCatalogImages(game: GameSeed, consoleName: string) {
  const staticDir = path.join(process.cwd(), "static")
  fs.mkdirSync(staticDir, { recursive: true })

  const stamp = Date.now()
  const base = `${stamp}-${game.handle}`
  const titleLines = wrapTitle(game.title)
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="200" y="${210 + index * 34}" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${game.ink}">${escapeXml(line)}</text>`
    )
    .join("")

  const front = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <rect width="400" height="560" fill="#F8FAFC"/>
  <rect x="18" y="18" width="364" height="524" rx="10" fill="${game.accent}"/>
  <rect x="34" y="34" width="332" height="492" rx="8" fill="#FFF7ED"/>
  <rect x="34" y="34" width="332" height="70" fill="${game.ink}"/>
  <text x="200" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC">${escapeXml(consoleName)}</text>
  ${titleSvg}
  <rect x="90" y="360" width="220" height="120" rx="8" fill="${game.ink}" opacity="0.12"/>
  <text x="200" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${game.ink}">BOX FRONT</text>
  <text x="200" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${game.ink}">Quezo's Game Stache</text>
</svg>`

  const back = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <rect width="400" height="560" fill="#E2E8F0"/>
  <rect x="18" y="18" width="364" height="524" rx="10" fill="${game.ink}"/>
  <rect x="40" y="50" width="320" height="460" rx="8" fill="#F8FAFC"/>
  <text x="200" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${game.ink}">BOX BACK</text>
  <text x="60" y="160" font-family="Arial, sans-serif" font-size="16" fill="${game.ink}">${escapeXml(game.title)}</text>
  <text x="60" y="200" font-family="Arial, sans-serif" font-size="14" fill="#334155">${escapeXml(consoleName)} · Physical edition</text>
  <rect x="60" y="240" width="280" height="12" fill="${game.accent}"/>
  <rect x="60" y="270" width="240" height="10" fill="#CBD5E1"/>
  <rect x="60" y="295" width="260" height="10" fill="#CBD5E1"/>
  <rect x="60" y="320" width="200" height="10" fill="#CBD5E1"/>
  <text x="200" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#475569">Catalog placeholder art</text>
</svg>`

  const media =
    game.media === "cartridge"
      ? `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#F1F5F9"/>
  <rect x="90" y="55" width="220" height="290" rx="18" fill="${game.accent}" stroke="${game.ink}" stroke-width="6"/>
  <rect x="115" y="85" width="170" height="90" rx="8" fill="#0F172A"/>
  <text x="200" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#F8FAFC">CART</text>
  <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${game.ink}">${escapeXml(wrapTitle(game.title, 14)[0])}</text>
  <rect x="130" y="290" width="140" height="18" rx="4" fill="${game.ink}" opacity="0.35"/>
</svg>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#F1F5F9"/>
  <circle cx="200" cy="200" r="140" fill="${game.accent}" stroke="${game.ink}" stroke-width="8"/>
  <circle cx="200" cy="200" r="28" fill="#F8FAFC"/>
  <circle cx="200" cy="200" r="10" fill="${game.ink}"/>
  <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${game.ink}">DISC</text>
  <text x="200" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${game.ink}">${escapeXml(wrapTitle(game.title, 16)[0])}</text>
</svg>`

  const manual = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
  <rect width="360" height="480" fill="#FEF3C7"/>
  <rect x="24" y="24" width="312" height="432" rx="6" fill="#FFFBEB" stroke="${game.ink}" stroke-width="4"/>
  <text x="180" y="90" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${game.ink}">MANUAL</text>
  <text x="180" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${game.ink}">${escapeXml(wrapTitle(game.title, 18)[0])}</text>
  <rect x="60" y="180" width="240" height="8" fill="${game.accent}"/>
  <rect x="60" y="210" width="220" height="8" fill="#D6D3D1"/>
  <rect x="60" y="235" width="200" height="8" fill="#D6D3D1"/>
  <rect x="60" y="260" width="230" height="8" fill="#D6D3D1"/>
  <rect x="60" y="285" width="180" height="8" fill="#D6D3D1"/>
  <text x="180" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#78716C">${escapeXml(consoleName)}</text>
</svg>`

  const files = [
    { name: `${base}-front.svg`, content: front },
    { name: `${base}-back.svg`, content: back },
    { name: `${base}-media.svg`, content: media },
    { name: `${base}-manual.svg`, content: manual },
  ]

  return files.map((file) => {
    fs.writeFileSync(path.join(staticDir, file.name), file.content, "utf8")
    return `${BACKEND_URL}/static/${encodeURIComponent(file.name)}`
  })
}

function prices(usd: number, eur: number) {
  return [
    { amount: usd, currency_code: "usd" },
    { amount: eur, currency_code: "eur" },
    { amount: eur, currency_code: "eur", rules: { region_id: REGION_EU } },
    { amount: usd, currency_code: "usd", rules: { region_id: REGION_EC } },
  ]
}

export default async function fillConsoleGames({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active"],
  })

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id", "categories.handle"],
  })

  const takenHandles = new Set(
    existingProducts.map((product) => product.handle).filter(Boolean)
  )

  const productsByCategory = new Map<string, number>()
  for (const category of categories) {
    productsByCategory.set(category.id, 0)
  }
  for (const product of existingProducts) {
    for (const category of product.categories || []) {
      productsByCategory.set(
        category.id,
        (productsByCategory.get(category.id) || 0) + 1
      )
    }
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    throw new Error("No shipping profile found.")
  }

  const toCreate: Record<string, unknown>[] = []

  for (const category of categories) {
    if (!category.is_active) {
      continue
    }

    const current = productsByCategory.get(category.id) || 0
    const needed = TARGET_PER_CATEGORY - current
    if (needed <= 0) {
      logger.info(`${category.name}: already has ${current} products.`)
      continue
    }

    const pool = [...(CATALOG[category.handle] || [])]
    const picks: GameSeed[] = []

    for (const candidate of pool) {
      if (picks.length >= needed) {
        break
      }
      if (takenHandles.has(candidate.handle)) {
        continue
      }
      picks.push(candidate)
      takenHandles.add(candidate.handle)
    }

    let filler = 1
    while (picks.length < needed) {
      const handle = `${category.handle}-game-${current + picks.length + 1}`
      if (takenHandles.has(handle)) {
        filler += 1
        continue
      }
      picks.push({
        title: `${category.name} Classic ${current + picks.length + 1}`,
        handle,
        description: `Videojuego físico para ${category.name}. Edición de catálogo con caja, medio y manual.`,
        usd: 40 + picks.length * 5,
        eur: 35 + picks.length * 5,
        accent: "#64748B",
        ink: "#0F172A",
        media:
          category.handle.includes("nintendo") ||
          category.handle.includes("super-nintendo") ||
          category.handle === "nintendo-64"
            ? "cartridge"
            : "disc",
      })
      takenHandles.add(handle)
      filler += 1
    }

    for (const game of picks) {
      const images = writeCatalogImages(game, category.name)
      toCreate.push({
        title: game.title,
        handle: game.handle,
        description: game.description,
        status: ProductStatus.PUBLISHED,
        discountable: true,
        thumbnail: images[0],
        images: images.map((url) => ({ url })),
        weight: 200,
        shipping_profile_id: shippingProfile.id,
        category_ids: [category.id],
        sales_channels: [{ id: SALES_CHANNEL_ID }],
        options: [
          {
            title: "Default option",
            values: ["Default option value"],
          },
        ],
        variants: [
          {
            title: "Juego",
            options: {
              "Default option": "Default option value",
            },
            manage_inventory: false,
            prices: prices(game.usd, game.eur),
          },
        ],
      })
    }

    logger.info(`${category.name}: creating ${picks.length} product(s).`)
  }

  if (!toCreate.length) {
    logger.info("Every category already has enough products.")
    return
  }

  const batchSize = 5
  for (let start = 0; start < toCreate.length; start += batchSize) {
    const batch = toCreate.slice(start, start + batchSize)
    await createProductsWorkflow(container).run({
      input: { products: batch as never },
    })
    logger.info(
      `Created ${Math.min(start + batchSize, toCreate.length)}/${toCreate.length}`
    )
  }

  const search = container.resolve(Modules.SEARCH)
  const { data: allProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
  })
  for (let start = 0; start < allProducts.length; start += 25) {
    const chunk = allProducts.slice(start, start + 25)
    await search.ingest({
      name: "product.created",
      data: chunk.map((product) => ({ id: product.id })),
    } as never)
  }

  logger.info(`Done. Catalog now has ${allProducts.length} product(s).`)
}
