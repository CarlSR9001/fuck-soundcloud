/**
 * Charities service - manages charity organizations
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Charity } from '@/entities/charity.entity';
import { CreateCharityDto } from './dto';

@Injectable()
export class CharitiesService {
  constructor(
    @InjectRepository(Charity)
    private charityRepo: Repository<Charity>,
  ) {}

  async listActiveCharities(): Promise<Charity[]> {
    return this.charityRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async getCharityBySlug(slug: string): Promise<Charity> {
    const charity = await this.charityRepo.findOne({ where: { slug } });

    if (!charity) {
      throw new NotFoundException(`Charity with slug "${slug}" not found`);
    }

    return charity;
  }

  async createCharity(dto: CreateCharityDto): Promise<Charity> {
    // Check if slug already exists
    const existing = await this.charityRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Charity with slug "${dto.slug}" already exists`);
    }

    const charity = this.charityRepo.create({
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      website_url: dto.website_url,
      tax_id: dto.tax_id,
      logo_url: dto.logo_url,
      is_active: dto.is_active ?? true,
    });

    return this.charityRepo.save(charity);
  }
}
