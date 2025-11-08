/**
 * Asset entity type
 * Represents a stored file in object storage (MinIO)
 */
export interface Asset {
  id: string;
  bucket: string;
  key: string;
  size_bytes: number;
  mime: string;
  sha256: string;
  created_at: Date;
}

/**
 * Asset creation input
 */
export interface CreateAssetInput {
  bucket: string;
  key: string;
  size_bytes: number;
  mime: string;
  sha256: string;
}

/**
 * Multipart upload initialization response
 */
export interface MultipartUploadInit {
  upload_id: string;
  presigned_parts: PresignedPart[];
}

/**
 * Presigned URL for multipart upload part
 */
export interface PresignedPart {
  part_number: number;
  url: string;
}

/**
 * Multipart upload completion input
 */
export interface MultipartUploadComplete {
  upload_id: string;
  etags: PartETag[];
}

/**
 * Part ETag for multipart completion
 */
export interface PartETag {
  part_number: number;
  etag: string;
}
