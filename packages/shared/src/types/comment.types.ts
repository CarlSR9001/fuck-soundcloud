/**
 * Comment entity type
 * Represents a comment on a track (optionally at a timestamp)
 */
export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  parent_id?: string;
  at_ms?: number;
  body_md: string;
  visibility: 'visible' | 'hidden' | 'pending';
  created_at: Date;
  updated_at: Date;
}

/**
 * Comment creation input
 */
export interface CreateCommentInput {
  track_id: string;
  body_md: string;
  at_ms?: number;
  parent_id?: string;
}

/**
 * Comment update input
 */
export interface UpdateCommentInput {
  body_md?: string;
  visibility?: 'visible' | 'hidden' | 'pending';
}
