import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Asset } from '../../entities';
import { StorageService } from '../storage';
import { UpdateProfileDto } from './dto';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private storageService: StorageService,
  ) {}

  async getUserByHandle(handle: string) {
    const user = await this.userRepository.findOne({
      where: { handle },
      relations: ['tracks'],
    });

    if (!user) {
      throw new NotFoundException(`User with handle @${handle} not found`);
    }

    return this.sanitizeUser(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tracks'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.display_name !== undefined) {
      user.display_name = data.display_name;
    }

    if (data.bio !== undefined) {
      user.bio = data.bio;
    }

    await this.userRepository.save(user);

    return this.sanitizeUser(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for avatars');
    }

    // Resize image to 400x400 using sharp
    const resizedBuffer = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Generate SHA256 hash
    const hash = crypto.createHash('sha256').update(resizedBuffer).digest('hex');

    // Upload to MinIO images bucket
    const bucket = this.storageService.getBucketName('images');
    const key = `avatars/${userId}/${Date.now()}.jpg`;

    await this.storageService.uploadFile(bucket, key, resizedBuffer, 'image/jpeg');

    // Create asset record
    const asset = this.assetRepository.create({
      bucket,
      key,
      size_bytes: resizedBuffer.length,
      mime: 'image/jpeg',
      sha256: hash,
    });

    await this.assetRepository.save(asset);

    // Update user's avatar_asset_id
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatar_asset_id = asset.id;
    await this.userRepository.save(user);

    // Return asset URL
    const url = await this.storageService.getObjectUrl(bucket, key);

    return {
      assetId: asset.id,
      url,
    };
  }

  async findByHandle(handle: string) {
    return await this.userRepository.findOne({ where: { handle } });
  }

  async findById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(email: string, handle: string, passwordHash: string) {
    const user = this.userRepository.create({
      email,
      handle,
      password_hash: passwordHash,
      display_name: handle,
    });

    return await this.userRepository.save(user);
  }

  async update(id: string, data: any) {
    await this.userRepository.update(id, data);
    return await this.findById(id);
  }

  private sanitizeUser(user: User) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}
