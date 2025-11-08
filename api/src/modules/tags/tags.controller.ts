import { Controller, Get, Param } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('api/v1/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * GET /api/v1/tags
   * List all tags with usage count
   */
  @Get()
  async findAll() {
    return await this.tagsService.findAll();
  }

  /**
   * GET /api/v1/tags/:slug
   * Get tag details with associated tracks
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return await this.tagsService.findBySlug(slug);
  }
}
