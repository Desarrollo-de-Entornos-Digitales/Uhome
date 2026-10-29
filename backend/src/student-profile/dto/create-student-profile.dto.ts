export class CreateStudentProfileDto {
  university: string;
  maxBudget: number;
  maxDistanceToCampus?: number;
  safetyPriority: string;
  nightlifePriority: string;
  amenitiesPriority?: string;
  vibePreference?: string;
  desiredStayMonths?: number | null;
  preferredPropertyTypeId?: number | null;
  minBedrooms?: number;
  minBathrooms?: number;
  petFriendly?: boolean;
  userId: number;
}
