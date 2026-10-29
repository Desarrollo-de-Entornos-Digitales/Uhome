import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyMapLoader from "@/components/PropertyMapLoader";
import ProgressBar from "@/components/ProgressBar";
import Alert from "@/components/Alert";
import {
  getPropertyById,
  getPropertyReviews,
  getPropertyVibe,
} from "@/services/properties";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  let property;

  try {
    property = await getPropertyById(id);
  } catch {
    notFound();
  }

  const [reviewsResult, vibeResult] = await Promise.allSettled([
    getPropertyReviews(id),
    getPropertyVibe(id),
  ]);

  const reviews =
    reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const vibe =
    vibeResult.status === "fulfilled" ? vibeResult.value : null;

  const vibeItems = vibe
    ? [
        { label: "Ambiente estudiantil", value: vibe.studentDensity },
        { label: "Vida nocturna", value: vibe.nightlife },
        { label: "Lugares para estudiar", value: vibe.studySpots },
        { label: "Tranquilidad", value: vibe.quietness },
        { label: "Servicios esenciales", value: vibe.essentialSpots },
      ]
    : [];

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 text-gray-900 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-semibold text-red-600 hover:underline">
          ← Volver a propiedades
        </Link>

        <header className="mb-8 mt-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
              {property.propertyType?.name ?? "Vivienda"}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
              {property.available ? "Disponible" : "No disponible"}
            </span>
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">{property.name}</h1>
          <p className="mt-3 text-gray-600">📍 {property.address}</p>
          <p className="mt-4 text-2xl font-bold text-red-600">
            {formatPrice(property.price)}
            <span className="ml-2 text-sm font-normal text-gray-500">/ mes</span>
          </p>
        </header>

        <section className="mb-6 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 text-xl font-bold">Sobre esta vivienda</h2>
          <p className="leading-7 text-gray-600">{property.description}</p>
          <p className="mt-4 text-sm text-gray-600">
            Distancia al campus: {(property.distanceToCampus / 1000).toLocaleString("es-CO", {
  maximumFractionDigits: 2,
})} km
          </p>
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">Características</h2>
          {property.characteristics?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {property.characteristics.map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-lg bg-gray-50 p-3">
                  ✓ {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay características adicionales registradas.</p>
          )}

          <h3 className="mb-3 mt-6 font-semibold">Servicios y amenidades</h3>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <span key={amenity.id} className="rounded-full bg-red-50 px-3 py-2 text-sm text-red-800">
                {amenity.name}
              </span>
            ))}
            {!property.amenities.length && (
              <p className="text-gray-500">No hay amenidades registradas.</p>
            )}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-6">
          <h2 className="mb-3 text-xl font-bold">Condiciones del contrato</h2>
          <p className="whitespace-pre-line leading-7 text-gray-600">
            {property.contractConditions || "Consulta las condiciones del contrato con el arrendador."}
          </p>
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-6">
          <h2 className="mb-2 text-xl font-bold">Vibe Analyzer</h2>
          <p className="mb-6 text-sm text-gray-500">
            Indicadores del entorno convertidos a porcentaje sobre 100%.
          </p>
          {vibeItems.length ? (
            <div className="space-y-5">
              {vibeItems.map((item) => (
                <ProgressBar key={item.label} label={item.label} value={item.value * 20} />
              ))}
            </div>
          ) : (
            <Alert type="info" message="No hay un análisis de ambiente registrado para esta vivienda." />
          )}
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">Ubicación</h2>
          <PropertyMapLoader
            latitude={property.latitude}
            longitude={property.longitude}
            name={property.name}
          />
        </section>

        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-5 text-xl font-bold">Reseñas ({reviews.length})</h2>
          {reviews.length ? (
            <div className="space-y-5">
              {reviews.map((review) => (
                <article key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between gap-3">
                    <h3 className="font-semibold">
                      {review.user?.fullName ?? review.user?.username ?? "Estudiante"}
                    </h3>
                    <span className="text-amber-600" aria-label={`${review.rating} de 5 estrellas`}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aún no hay reseñas para esta vivienda.</p>
          )}
        </section>
      </div>
    </main>
  );
}
