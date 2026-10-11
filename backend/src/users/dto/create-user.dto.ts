export class CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  username: string;
  roleId?: number;
}