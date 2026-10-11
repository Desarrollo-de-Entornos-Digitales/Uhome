export class CreatePropertyDto {
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price: number;
  propertyTypeId: number;
  distanceToCampus: number;
  available: boolean;
}
