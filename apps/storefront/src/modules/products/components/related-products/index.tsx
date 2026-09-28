import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

function isSameProduct(
  current: HttpTypes.StoreProduct,
  candidate?: { id?: string | null; handle?: string | null; title?: string | null }
) {
  if (!candidate) {
    return false
  }

  if (current.id && candidate.id === current.id) {
    return true
  }

  if (current.handle && candidate.handle === current.handle) {
    return true
  }

  return Boolean(current.title && candidate.title === current.title)
}

async function getConsoleCategoryIds(product: HttpTypes.StoreProduct) {
  const fromProduct = (product.categories ?? [])
    .map((category) => category.id)
    .filter(Boolean)

  if (fromProduct.length) {
    return fromProduct
  }

  const categories = await listCategories()

  const match = categories?.find((category) =>
    category.products?.some((item) => isSameProduct(product, item))
  )

  return match?.id ? [match.id] : []
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const categoryIds = await getConsoleCategoryIds(product)

  if (!categoryIds.length) {
    return null
  }

  const products = await listProducts({
    queryParams: {
      category_id: categoryIds,
      is_giftcard: false,
      limit: 8,
    },
    countryCode,
  }).then(({ response }) => {
    return response.products
      .filter((responseProduct) => !isSameProduct(product, responseProduct))
      .slice(0, 4)
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Productos relacionados
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          También te pueden interesar estos juegos.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
