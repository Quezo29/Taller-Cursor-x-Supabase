import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

const COUNTRY_CODE = "ec"

export default async function addEcRegion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  await ensureUsdIsDefault(container, query, logger)

  const region = await ensureEcuadorRegion(container, query, logger)
  await ensureEcuadorTaxRegion(container, query, logger)

  const serviceZoneId = await ensureEcuadorServiceZone(
    query,
    fulfillment,
    link,
    logger
  )
  await ensureStandardShipping(container, query, serviceZoneId, region.id, logger)

  logger.info("Ecuador region is ready (USD).")
}

async function ensureUsdIsDefault(
  container: ExecArgs["container"],
  query: { graph: Function },
  logger: { info: (message: string) => void }
) {
  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })

  const store = stores[0]
  if (!store) {
    throw new Error("No store found. Run migrations before this script.")
  }

  const currencies = (store.supported_currencies ?? []) as {
    currency_code: string
    is_default?: boolean
  }[]
  const usd = currencies.find((currency) => currency.currency_code === "usd")

  if (usd?.is_default) {
    logger.info("USD is already the default store currency.")
    return
  }

  const supported = currencies
    .filter((currency) => currency.currency_code !== "usd")
    .map((currency) => ({
      currency_code: currency.currency_code,
      is_default: false,
    }))

  supported.unshift({ currency_code: "usd", is_default: true })

  if (!supported.some((currency) => currency.currency_code === "eur")) {
    supported.push({ currency_code: "eur", is_default: false })
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { supported_currencies: supported },
    },
  })

  logger.info("Set USD as the default store currency.")
}

async function ensureEcuadorRegion(
  container: ExecArgs["container"],
  query: { graph: Function },
  logger: { info: (message: string) => void }
) {
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })

  const existing = (regions as RegionRow[]).find((region) =>
    region.countries?.some((country) => country.iso_2 === COUNTRY_CODE)
  )

  if (existing) {
    logger.info(`Region for ${COUNTRY_CODE} already exists (${existing.id}).`)
    return existing
  }

  const { result } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Ecuador",
          currency_code: "usd",
          countries: [COUNTRY_CODE],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })

  logger.info(`Created Ecuador region ${result[0].id}.`)
  return {
    id: result[0].id,
    name: result[0].name,
    currency_code: result[0].currency_code,
  }
}

async function ensureEcuadorTaxRegion(
  container: ExecArgs["container"],
  query: { graph: Function },
  logger: { info: (message: string) => void }
) {
  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })

  const existing = (taxRegions as { id: string; country_code: string }[]).find(
    (taxRegion) => taxRegion.country_code === COUNTRY_CODE
  )

  if (existing) {
    logger.info(`Tax region for ${COUNTRY_CODE} already exists (${existing.id}).`)
    return
  }

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: COUNTRY_CODE,
        provider_id: "tp_system",
      },
    ],
  })

  logger.info(`Created tax region for ${COUNTRY_CODE}.`)
}

async function ensureEcuadorServiceZone(
  query: { graph: Function },
  fulfillment: {
    createFulfillmentSets: (data: object) => Promise<{
      id: string
      service_zones: { id: string }[]
    }>
    createServiceZones: (data: object) => Promise<{ id: string }>
  },
  link: { create: (data: object) => Promise<unknown> },
  logger: { info: (message: string) => void }
) {
  const { data: fulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: [
      "id",
      "type",
      "service_zones.id",
      "service_zones.geo_zones.country_code",
      "service_zones.geo_zones.type",
    ],
  })

  const sets = fulfillmentSets as FulfillmentSetRow[]
  const existingZone = sets
    .flatMap((set) => set.service_zones ?? [])
    .find((zone) =>
      zone.geo_zones?.some(
        (geoZone) =>
          geoZone.type === "country" && geoZone.country_code === COUNTRY_CODE
      )
    )

  if (existingZone) {
    logger.info(`Service zone for ${COUNTRY_CODE} already exists (${existingZone.id}).`)
    return existingZone.id
  }

  const shippingSet = sets.find((set) => set.type === "shipping") ?? sets[0]

  if (shippingSet) {
    const created = await fulfillment.createServiceZones({
      name: "Ecuador",
      fulfillment_set_id: shippingSet.id,
      geo_zones: [{ type: "country", country_code: COUNTRY_CODE }],
    })
    logger.info(`Created Ecuador service zone ${created.id}.`)
    return created.id
  }

  const createdSet = await fulfillment.createFulfillmentSets({
    name: "Ecuador delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Ecuador",
        geo_zones: [{ type: "country", country_code: COUNTRY_CODE }],
      },
    ],
  })

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocation = (locations as { id: string }[])[0]

  if (stockLocation) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: createdSet.id },
    })
  }

  const zoneId = createdSet.service_zones[0].id
  logger.info(`Created Ecuador fulfillment set and service zone ${zoneId}.`)
  return zoneId
}

async function ensureStandardShipping(
  container: ExecArgs["container"],
  query: { graph: Function },
  serviceZoneId: string,
  regionId: string,
  logger: { info: (message: string) => void }
) {
  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id"],
  })

  const existing = (shippingOptions as ShippingOptionRow[]).find(
    (option) =>
      option.service_zone_id === serviceZoneId && option.name === "Standard"
  )

  if (existing) {
    logger.info(`Standard shipping for Ecuador already exists (${existing.id}).`)
    return
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = (shippingProfiles as { id: string }[])[0]

  if (!shippingProfile) {
    throw new Error("No shipping profile found.")
  }

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          { currency_code: "usd", amount: 10 },
          { region_id: regionId, amount: 10 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  logger.info("Created Standard shipping for Ecuador at 10 USD.")
}

type RegionRow = {
  id: string
  name?: string
  currency_code?: string
  countries?: { iso_2?: string | null }[] | null
}

type FulfillmentSetRow = {
  id: string
  type?: string
  service_zones?: {
    id: string
    geo_zones?: { country_code?: string | null; type?: string | null }[] | null
  }[] | null
}

type ShippingOptionRow = {
  id: string
  name?: string | null
  service_zone_id?: string | null
}
