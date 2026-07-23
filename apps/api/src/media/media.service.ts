import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/**
 * Cloudinary signed-upload support. The API secret never leaves the server:
 * we hand the browser a short-lived signature and it uploads the file
 * directly to Cloudinary (the large binary never passes through our API).
 * No SDK needed — the signature is a SHA-1 of the signed params + secret.
 */
@Injectable()
export class MediaService {
  private config() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      );
    }
    return { cloudName, apiKey, apiSecret };
  }

  signUpload(): UploadSignature {
    const { cloudName, apiKey, apiSecret } = this.config();
    const folder = process.env.CLOUDINARY_FOLDER ?? "gibeon/products";
    const timestamp = Math.floor(Date.now() / 1000);
    // Signed params, sorted alphabetically and joined with '&', then the
    // secret appended — must match exactly what the browser sends on upload.
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash("sha1")
      .update(toSign + apiSecret)
      .digest("hex");
    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
