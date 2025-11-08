import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag, TrackTag } from '../../entities';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(TrackTag)
    private trackTagRepository: Repository<TrackTag>,
  ) {}

  /**
   * Find existing tags or create new ones from an array of tag names
   * Returns array of tag IDs
   */
  async findOrCreateTags(names: string[]): Promise<string[]> {
    if (!names || names.length === 0) {
      return [];
    }

    // Normalize and deduplicate tag names
    const uniqueNames = [...new Set(names.map((name) => name.trim()))].filter(
      (name) => name.length > 0,
    );

    if (uniqueNames.length === 0) {
      return [];
    }

    // Generate slugs for all names
    const slugs = uniqueNames.map((name) => this.slugify(name));

    // Find existing tags
    const existingTags = await this.tagRepository.find({
      where: { slug: In(slugs) },
    });

    const existingSlugSet = new Set(existingTags.map((tag) => tag.slug));
    const tagIds: string[] = existingTags.map((tag) => tag.id);

    // Create missing tags
    const missingNames = uniqueNames.filter(
      (name) => !existingSlugSet.has(this.slugify(name)),
    );

    for (const name of missingNames) {
      const slug = this.slugify(name);
      const newTag = this.tagRepository.create({ name, slug });
      const savedTag = await this.tagRepository.save(newTag);
      tagIds.push(savedTag.id);
    }

    return tagIds;
  }

  /**
   * Set tags for a track (replaces all existing tags)
   */
  async setTrackTags(trackId: string, tagNames: string[]): Promise<void> {
    // Remove existing track tags
    await this.trackTagRepository.delete({ track_id: trackId });

    if (!tagNames || tagNames.length === 0) {
      return;
    }

    // Get or create tag IDs
    const tagIds = await this.findOrCreateTags(tagNames);

    // Create new track-tag associations
    const trackTags = tagIds.map((tagId) =>
      this.trackTagRepository.create({
        track_id: trackId,
        tag_id: tagId,
      }),
    );

    await this.trackTagRepository.save(trackTags);
  }

  /**
   * Get all tags with usage count
   */
  async findAll(): Promise<Array<Tag & { usage_count: number }>> {
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.track_tags', 'track_tag')
      .select('tag.id', 'id')
      .addSelect('tag.name', 'name')
      .addSelect('tag.slug', 'slug')
      .addSelect('tag.created_at', 'created_at')
      .addSelect('COUNT(track_tag.id)::int', 'usage_count')
      .groupBy('tag.id')
      .orderBy('usage_count', 'DESC')
      .addOrderBy('tag.name', 'ASC')
      .getRawMany();

    return tags;
  }

  /**
   * Get a tag by slug with its associated tracks
   */
  async findBySlug(slug: string) {
    const tag = await this.tagRepository.findOne({
      where: { slug },
      relations: ['track_tags', 'track_tags.track'],
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }

    // Map to include track details
    const tracks = tag.track_tags
      .map((tt) => tt.track)
      .filter((track) => track !== null);

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      created_at: tag.created_at,
      tracks,
    };
  }

  /**
   * Get tags for a specific track
   */
  async getTrackTags(trackId: string): Promise<Tag[]> {
    const trackTags = await this.trackTagRepository.find({
      where: { track_id: trackId },
      relations: ['tag'],
    });

    return trackTags.map((tt) => tt.tag);
  }

  /**
   * Slugify a tag name (lowercase, replace spaces/special chars with hyphens)
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
