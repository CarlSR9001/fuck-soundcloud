/**
 * Seed script for initial charity organizations
 * Creates EFF, Music Education Foundation, and Artist Relief Fund
 */

import { DataSource } from 'typeorm';
import { Charity } from '../entities/charity.entity';

const INITIAL_CHARITIES = [
  {
    slug: 'eff',
    name: 'Electronic Frontier Foundation',
    description:
      'The Electronic Frontier Foundation is the leading nonprofit organization defending civil liberties in the digital world. Founded in 1990, EFF champions user privacy, free expression, and innovation through impact litigation, policy analysis, grassroots activism, and technology development.',
    website_url: 'https://www.eff.org',
    tax_id: '04-3091431',
    logo_url: 'https://www.eff.org/sites/all/themes/frontier/images/logo_full.png',
    is_active: true,
  },
  {
    slug: 'music-education',
    name: 'The Music Education Foundation',
    description:
      'The Music Education Foundation provides music education opportunities to underserved communities. We believe that every child deserves access to quality music instruction and the transformative power of music. Our programs include instrument donations, scholarship funding, and teacher training.',
    website_url: 'https://example.org/music-education',
    tax_id: null,
    logo_url: null,
    is_active: true,
  },
  {
    slug: 'artist-relief',
    name: 'Artist Relief Fund',
    description:
      'The Artist Relief Fund provides emergency financial assistance to musicians and artists facing hardship due to medical issues, natural disasters, or economic challenges. We offer grants, resources, and community support to help artists continue creating during difficult times.',
    website_url: 'https://example.org/artist-relief',
    tax_id: null,
    logo_url: null,
    is_active: true,
  },
];

export async function seedCharities(dataSource: DataSource): Promise<void> {
  const charityRepo = dataSource.getRepository(Charity);

  console.log('🌱 Seeding initial charities...');

  for (const charityData of INITIAL_CHARITIES) {
    const existing = await charityRepo.findOne({ where: { slug: charityData.slug } });

    if (existing) {
      console.log(`  ✓ Charity "${charityData.name}" already exists, skipping`);
      continue;
    }

    const charity = charityRepo.create(charityData);
    await charityRepo.save(charity);
    console.log(`  ✓ Created charity: ${charityData.name}`);
  }

  console.log('✅ Charity seeding complete!\n');
}

// CLI execution
if (require.main === module) {
  (async () => {
    const { AppDataSource } = await import('../data-source');

    try {
      await AppDataSource.initialize();
      await seedCharities(AppDataSource);
      await AppDataSource.destroy();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  })();
}
