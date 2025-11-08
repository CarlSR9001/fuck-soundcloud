import { IsUUID } from 'class-validator';

export class FollowDto {
  @IsUUID()
  user_id: string;
}
