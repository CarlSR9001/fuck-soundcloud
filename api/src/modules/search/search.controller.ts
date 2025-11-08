import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto';

@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() dto: SearchDto) {
    return await this.searchService.search(dto);
  }
}
