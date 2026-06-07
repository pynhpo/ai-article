import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'idToken is required' })
  idToken: string;
}
