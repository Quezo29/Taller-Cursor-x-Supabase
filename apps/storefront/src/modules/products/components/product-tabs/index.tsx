"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"

const ProductTabs = () => {
  const tabs = [
    {
      label: "Envío y devoluciones",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Entrega rápida</span>
            <p className="max-w-sm">
              Tu pedido llega en 3 a 5 días hábiles, en un punto de retiro o en
              tu casa.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Cambios sencillos</span>
            <p className="max-w-sm">
              ¿No era lo que esperabas? Lo cambiamos por otro sin problema.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Devoluciones fáciles</span>
            <p className="max-w-sm">
              Devuelve el producto y te reembolsamos. Hacemos lo posible para
              que la devolución sea sencilla.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
