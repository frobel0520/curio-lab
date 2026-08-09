export const QUOTA_LIMITS = {
  uploadsPerDay: 500,
  uploadsPerMonth: 10_000,
  imageReadsPerDay: 50_000,
  imageReadsPerMonth: 1_000_000,
  bytesUploadedPerMonth: 1_000_000_000,
  liveStorageBytes: 500_000_000,
  uploadsPerClientPerDay: 5,
  maxImageBytes: 1_500_000,
  retentionDays: 7,
} as const;

export type Usage = {
  uploads: number;
  image_reads: number;
  bytes_uploaded: number;
};

export type DailyUsage = { uploads: number; image_reads: number };

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function canUpload(usage: Usage, imageBytes: number) {
  return usage.uploads < QUOTA_LIMITS.uploadsPerMonth
    && usage.bytes_uploaded + imageBytes <= QUOTA_LIMITS.bytesUploadedPerMonth;
}

export function canReadImage(usage: Usage) {
  return usage.image_reads < QUOTA_LIMITS.imageReadsPerMonth;
}

export function quotaSnapshot(usage: Usage, daily: DailyUsage, bytesLive: number) {
  return {
    uploadEnabled: canUpload(usage, 1)
      && daily.uploads < QUOTA_LIMITS.uploadsPerDay
      && bytesLive < QUOTA_LIMITS.liveStorageBytes,
    imageReadEnabled: canReadImage(usage) && daily.image_reads < QUOTA_LIMITS.imageReadsPerDay,
    usage,
    daily,
    bytesLive,
    limits: QUOTA_LIMITS,
  };
}
