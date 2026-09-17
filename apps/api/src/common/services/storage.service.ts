import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../../config/app.config';
import { APP_CONFIG_TOKEN } from '../common.constants';

export interface StorageResult {
  url: string;
  key: string;
  provider: 'local' | 'r2' | 's3';
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private r2Client: any = null;

  constructor(@Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig) {
    if (this.config.STORAGE_TYPE !== 'local') {
      this.initR2Client();
    }
  }

  private initR2Client() {
    try {
      const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      this.r2Client = {
        s3: new S3Client({
          region: 'auto',
          endpoint: this.config.STORAGE_URL || `https://${this.config.STORAGE_BUCKET}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: this.config.STORAGE_KEY,
            secretAccessKey: this.config.STORAGE_SECRET,
          },
        }),
        getSignedUrl,
        GetObjectCommand,
        PutObjectCommand,
      };
      this.logger.log('R2/S3 storage client initialized');
    } catch (err) {
      this.logger.error(`Failed to init R2 client: ${(err as Error).message}. Falling back to local.`);
      this.config.STORAGE_TYPE = 'local';
    }
  }

  private getLocalDir(category: string): string {
    const dir = join(process.cwd(), 'storage', category);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  async upload(category: string, filename: string, data: Buffer, contentType: string): Promise<StorageResult> {
    const key = `${category}/${filename}`;

    if (this.config.STORAGE_TYPE === 'local' || !this.r2Client) {
      const dir = this.getLocalDir(category);
      const path = join(dir, filename);
      writeFileSync(path, data);
      return {
        url: `/api/v1/files/${category}/${filename}`,
        key,
        provider: 'local',
      };
    }

    try {
      const command = new this.r2Client.PutObjectCommand({
        Bucket: this.config.STORAGE_BUCKET,
        Key: key,
        Body: data,
        ContentType: contentType,
      });
      await this.r2Client.s3.send(command);
      const url = this.config.STORAGE_URL
        ? `${this.config.STORAGE_URL}/${key}`
        : `https://${this.config.STORAGE_BUCKET}.r2.cloudflarestorage.com/${key}`;
      return { url, key, provider: 'r2' };
    } catch (err) {
      this.logger.error(`R2 upload failed: ${(err as Error).message}. Falling back to local.`);
      const dir = this.getLocalDir(category);
      const path = join(dir, filename);
      writeFileSync(path, data);
      return {
        url: `/api/v1/files/${category}/${filename}`,
        key,
        provider: 'local',
      };
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.config.STORAGE_TYPE === 'local' || !this.r2Client) {
      const parts = key.split('/');
      const category = parts[0];
      const filename = parts.slice(1).join('/');
      return `/api/v1/files/${category}/${filename}`;
    }

    try {
      const command = new this.r2Client.GetObjectCommand({
        Bucket: this.config.STORAGE_BUCKET,
        Key: key,
      });
      return await this.r2Client.getSignedUrl(this.r2Client.s3, command, { expiresIn });
    } catch (err) {
      this.logger.error(`R2 signed URL failed: ${(err as Error).message}`);
      throw new NotFoundException('File not available');
    }
  }

  async read(category: string, filename: string): Promise<Buffer> {
    if (this.config.STORAGE_TYPE === 'local' || !this.r2Client) {
      const dir = join(process.cwd(), 'storage', category);
      const path = join(dir, filename);
      if (!existsSync(path)) throw new NotFoundException('File not found');
      return readFileSync(path);
    }

    try {
      const key = `${category}/${filename}`;
      const command = new this.r2Client.GetObjectCommand({
        Bucket: this.config.STORAGE_BUCKET,
        Key: key,
      });
      const response = await this.r2Client.s3.send(command);
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      this.logger.error(`R2 read failed: ${(err as Error).message}`);
      throw new NotFoundException('File not found');
    }
  }

  async delete(category: string, filename: string): Promise<void> {
    if (this.config.STORAGE_TYPE === 'local' || !this.r2Client) {
      const dir = join(process.cwd(), 'storage', category);
      const path = join(dir, filename);
      if (existsSync(path)) unlinkSync(path);
      return;
    }

    try {
      const key = `${category}/${filename}`;
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.config.STORAGE_BUCKET,
        Key: key,
      });
      await this.r2Client.s3.send(command);
    } catch (err) {
      this.logger.error(`R2 delete failed: ${(err as Error).message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.config.STORAGE_TYPE === 'local' || !this.r2Client) {
      const parts = key.split('/');
      const path = join(process.cwd(), 'storage', parts[0], parts.slice(1).join('/'));
      return existsSync(path);
    }

    try {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const command = new HeadObjectCommand({
        Bucket: this.config.STORAGE_BUCKET,
        Key: key,
      });
      await this.r2Client.s3.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getStorageType(): string {
    return this.config.STORAGE_TYPE;
  }
}
