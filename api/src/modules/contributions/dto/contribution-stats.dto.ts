export class ContributionStatsDto {
  total_contributed_cents: number;
  total_to_artists_cents: number;
  total_to_charity_cents: number;
  total_to_platform_cents: number;
  contribution_count: number;
  artists_supported_count: number;
  favorite_charity?: {
    id: string;
    name: string;
    slug: string;
  };
}
