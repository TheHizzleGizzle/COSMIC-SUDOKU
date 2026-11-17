/** Android rejects a versionCode above this (Google Play's documented ceiling). */
const MAX_VERSION_CODE = 2_100_000_000;

// vMAJOR.MINOR.PATCH, no leading zeros. MINOR and PATCH have three digits at most
// because versionCode packs them into three decimal places each.
const RELEASE_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$/;

export interface AndroidVersion {
  versionName: string;
  versionCode: number;
}

/**
 * Derives the Android version from a release tag. The tag is the single source of truth:
 * versionCode = MAJOR × 1,000,000 + MINOR × 1,000 + PATCH, so it only ever grows with the tag.
 * `undefined` means a development build (no tag).
 */
export function computeAndroidVersion(tag: string | undefined): AndroidVersion {
  if (tag === undefined) return { versionName: '0.0.0', versionCode: 1 };

  const invalid = (reason: string) =>
    new Error(`Invalid release tag ${JSON.stringify(tag)}: ${reason}`);

  if (!RELEASE_TAG.test(tag)) {
    throw invalid(
      'expected vMAJOR.MINOR.PATCH with no leading zeros and MINOR and PATCH below 1000',
    );
  }
  const [major = 0, minor = 0, patch = 0] = tag.slice(1).split('.').map(Number);
  const versionCode = major * 1_000_000 + minor * 1_000 + patch;
  if (versionCode < 1) throw invalid('versionCode must be at least 1');
  if (versionCode > MAX_VERSION_CODE) {
    throw invalid(`versionCode ${versionCode} is above Android's ${MAX_VERSION_CODE} limit`);
  }
  return { versionName: `${major}.${minor}.${patch}`, versionCode };
}

if (import.meta.main) {
  try {
    const { versionName, versionCode } = computeAndroidVersion(process.argv[2]);
    console.log(`COSMIC_VERSION_NAME=${versionName}`);
    console.log(`COSMIC_VERSION_CODE=${versionCode}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
