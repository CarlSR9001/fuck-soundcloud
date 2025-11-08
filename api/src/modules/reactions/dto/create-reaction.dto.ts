import { IsEnum, IsUUID } from 'class-validator';
import { ReactionTargetType, ReactionKind } from '../../../entities';

export class CreateReactionDto {
  @IsEnum(ReactionTargetType)
  target_type: ReactionTargetType;

  @IsUUID()
  target_id: string;

  @IsEnum(ReactionKind)
  kind: ReactionKind;
}
