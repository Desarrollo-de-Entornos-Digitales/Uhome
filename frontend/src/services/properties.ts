
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PropertyAmenity {
  id: number;
  name: string;
}

export interface Property {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  propertyTypeId: number;
  propertyType: {
    id: number;
    name: string;
  } | null;
  distanceToCampus: number;
  available: boolean;
  amenities: PropertyAmenity[];
  characteristics?: string[] | null;
  contractConditions?: string | null;
}

export interface PropertyReview {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  } | null;
}

export interface VibeAnalysis {
  id: number;
  studentDensity: number;
  nightlife: number;
  studySpots: number;
  quietness: number;
  essentialSpots: number;
  source: string;
  propertyId: number;
}

async function request<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error("Falta configurar NEXT_PUBLIC_API_URL.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la información (${response.status}).`);
  }

  return (await response.json()) as T;
}

export function getProperties(): Promise<Property[]> {
  return request<Property[]>("/properties");
}

export function getPropertyById(
  id: number | string,
): Promise<Property> {
  return request<Property>(`/properties/${id}`);
}

export function getPropertyReviews(
  propertyId: number | string,
): Promise<PropertyReview[]> {
  return request<PropertyReview[]>(
    `/reviews?propertyId=${encodeURIComponent(String(propertyId))}`,
  );
}

export async function getPropertyVibe(
  propertyId: number | string,
): Promise<VibeAnalysis | null> {
  const analyses = await request<VibeAnalysis[]>("/vibe-analysis");

  return analyses.find(
    (analysis) => analysis.propertyId === Number(propertyId),
  ) ?? null;
}
