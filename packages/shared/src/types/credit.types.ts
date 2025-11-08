/**
 * Credit role types
 */
export enum CreditRole {
  WRITER = 'writer',
  PRODUCER = 'producer',
  MIXER = 'mixer',
  MASTERING = 'mastering',
  FEATURE = 'feature',
  MUSICIAN = 'musician',
  OTHER = 'other',
}

/**
 * Credit entity type
 * Represents a credit/attribution for a track
 */
export interface Credit {
  id: string;
  track_id: string;
  person_name: string;
  role: CreditRole;
  url?: string;
  created_at: Date;
}

/**
 * Credit creation input
 */
export interface CreateCreditInput {
  person_name: string;
  role: CreditRole;
  url?: string;
}
