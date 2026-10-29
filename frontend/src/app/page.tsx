import { Suspense } from "react";
import Link from "next/link";
import { getProperties } from "@/services/properties";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

async function PropertiesList() {
  const properties = await getProperties();

  if (properties.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-gray-600">
        No hay propiedades registradas por el momento.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Propiedades</h2>
          <p className="mt-1 text-sm text-gray-600">
            Encuentra una vivienda que se adapte a ti.
          </p>
        </div>

        <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
          {properties.length} propiedades
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <div className="flex h-36 items-center justify-center bg-red-50">
              <span className="text-5xl" aria-hidden="true">
                🏠
              </span>
            </div>

            <div className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                  {property.propertyType?.name ?? "Vivienda"}
                </span>

                <span
                  className={
                    property.available
                      ? "text-xs font-medium text-green-700"
                      : "text-xs font-medium text-gray-500"
                  }
                >
                  {property.available ? "Disponible" : "No disponible"}
                </span>
              </div>

              <h3 className="text-lg font-semibold group-hover:text-red-600">
                {property.name}
              </h3>

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                {property.description}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                📍 {property.address}
              </p>

              <p className="mt-4 text-xl font-bold text-red-600">
                {formatPrice(property.price)}
                <span className="ml-1 text-xs font-normal text-gray-500">
                  / mes
                </span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities?.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>

              <p className="mt-5 font-semibold text-red-600">
                Ver detalles <span aria-hidden="true">→</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900 md:px-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
          Encuentra tu próximo hogar
        </p>

        <h1 className="mt-2 text-4xl font-bold">UHome</h1>

        <p className="mt-3 max-w-xl leading-7 text-gray-600">
          Explora opciones de vivienda, compara sus características y
          descubre los detalles antes de elegir tu próximo hogar.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="rounded-xl bg-white p-6 text-gray-600">
            Cargando propiedades...
          </div>
        }
      >
        <PropertiesList />
      </Suspense>
    </main>
  );
}
