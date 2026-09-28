import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero, { HeroGame } from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Quezo's Game Stache",
  description:
    "Tienda de juegos físicos.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: 100,
      fields: "id,title,handle,thumbnail,*images",
    },
  })

  const games: HeroGame[] = products.flatMap((product) => {
    const image = product.thumbnail || product.images?.[0]?.url
    if (!product.handle || !image) {
      return []
    }
    return [{ handle: product.handle, title: product.title ?? "", image }]
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero games={games} />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
