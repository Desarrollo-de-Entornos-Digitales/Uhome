export class CreateStudentProfileDto {
  university: string;
  maxBudget: number;
  maxDistanceToCampus?: number;
  safetyPriority: string;
  nightlifePriority: string;
  userId: number;
}
