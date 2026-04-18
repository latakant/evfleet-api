import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor() {
    const name = process.env.CLOUDINARY_CLOUD_NAME;
    const key = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;

    this.configured = !!(name && key && secret);

    if (this.configured) {
      cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
    } else {
      this.logger.warn('[Cloudinary] Not configured — using dev placeholder URLs');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    originalname: string,
    folder: string,
  ): Promise<string> {
    if (!this.configured) {
      return `https://placeholder.evfleet.dev/${folder}/${Date.now()}-${originalname}`;
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
          if (err || !result) return reject(err || new Error('Upload failed'));
          resolve(result.secure_url);
        })
        .end(buffer);
    });
  }
}
