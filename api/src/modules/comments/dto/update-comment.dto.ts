import { IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MaxLength(2000, {
    message: 'Comment body must not exceed 2000 characters',
  })
  body_md: string;
}
