/**
 * Reaction target types
 */
export enum ReactionTargetType {
  TRACK = 'track',
  COMMENT = 'comment',
  PLAYLIST = 'playlist',
}

/**
 * Reaction kinds
 */
export enum ReactionKind {
  LIKE = 'like',
  REPOST = 'repost',
}

/**
 * Reaction entity type
 * Represents a like or repost on a track/comment/playlist
 */
export interface Reaction {
  id: string;
  user_id: string;
  target_type: ReactionTargetType;
  target_id: string;
  kind: ReactionKind;
  created_at: Date;
}

/**
 * Reaction creation input
 */
export interface CreateReactionInput {
  target_type: ReactionTargetType;
  target_id: string;
  kind: ReactionKind;
}
