/**
 * Stem role types
 */
export enum StemRole {
  VOCAL = 'vocal',
  DRUM = 'drum',
  BASS = 'bass',
  GUITAR = 'guitar',
  SYNTH = 'synth',
  FX = 'fx',
  OTHER = 'other',
}

/**
 * Stem entity type
 * Represents an individual stem for a track version
 */
export interface Stem {
  id: string;
  track_version_id: string;
  role: StemRole;
  title: string;
  asset_id: string;
  created_at: Date;
}

/**
 * Stem creation input
 */
export interface CreateStemInput {
  track_version_id: string;
  role: StemRole;
  title: string;
  asset_id: string;
}
