import assert from "node:assert/strict";
import {
  QUOTA_LIMITS,
  canReadImage,
  canUpload,
  dayKey,
  monthKey,
  quotaSnapshot,
} from "../worker/src/quota.ts";

const empty = { uploads: 0, image_reads: 0, bytes_uploaded: 0 };
assert.equal(canUpload(empty, 250_000), true);
assert.equal(canUpload({ ...empty, uploads: QUOTA_LIMITS.uploadsPerMonth }, 1), false);
assert.equal(canUpload({ ...empty, bytes_uploaded: QUOTA_LIMITS.bytesUploadedPerMonth }, 1), false);
assert.equal(canReadImage({ ...empty, image_reads: QUOTA_LIMITS.imageReadsPerMonth }), false);
assert.equal(monthKey(new Date("2026-08-09T00:00:00Z")), "2026-08");
assert.equal(dayKey(new Date("2026-08-09T00:00:00Z")), "2026-08-09");
assert.equal(quotaSnapshot(empty, { uploads: 0, image_reads: 0 }, 0).uploadEnabled, true);

console.log("worker quota: 7 assertions passed");
