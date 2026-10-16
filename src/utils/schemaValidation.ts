import { z } from 'zod';
import { SpectrumPoint, SpectrumPeak, SpectrumRecord } from '../types/spectrum';

/**
 * Zod schema for a single spectral point [wavenumber, value].
 */
export const SpectrumPointSchema = z.tuple([z.number(), z.number()]);

/**
 * Zod schema for an array of spectral points [[wn, val], ...].
 */
export const SpectrumPointsArraySchema = z.array(SpectrumPointSchema);

/**
 * Zod schema for an identified infrared peak.
 */
export const SpectrumPeakSchema = z.object({
  wavenumber: z.number(),
  value: z.number(),
  intensity: z.number().optional().default(0),
  intensityType: z.enum(['muy fuerte', 'fuerte', 'media', 'débil', 'ancha']).or(z.string()),
  functionalGroup: z.string().optional(),
  assignment: z.string().optional(),
});

/**
 * Zod schema for an array of infrared peaks.
 */
export const SpectrumPeaksArraySchema = z.array(SpectrumPeakSchema);

/**
 * Zod schema for user-saved spectrum record from storage.
 */
export const SpectrumRecordSchema = z.object({
  id: z.string(),
  userId: z.string().optional().default('local-user'),
  userEmail: z.string().optional(),
  compoundName: z.string(),
  primaryFunctionalGroup: z.string(),
  secondaryFunctionalGroups: z.string().optional(),
  chemicalFormula: z.string().optional(),
  casNumber: z.string().optional(),
  sampleState: z.string().optional(),
  instrument: z.string().optional(),
  resolution: z.string().optional(),
  notes: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  yUnit: z.enum(['transmittance', 'absorbance']).catch('transmittance'),
  dataPointsJson: z.string(),
  peaksJson: z.string().optional(),
  createdAt: z.string().optional().default(() => new Date().toISOString()),
  updatedAt: z.string().optional().default(() => new Date().toISOString()),
  isReference: z.boolean().optional(),
  iupacName: z.string().optional(),
  molecularWeight: z.number().optional(),
});

/**
 * Safely parses and validates spectral data points from a JSON string.
 * If invalid or unparseable, discards the corrupted data and returns an empty array.
 */
export function safeParseDataPoints(rawJson: string | null | undefined): SpectrumPoint[] {
  if (!rawJson || typeof rawJson !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(rawJson);
    const result = SpectrumPointsArraySchema.safeParse(parsed);
    if (result.success) {
      return result.data as SpectrumPoint[];
    } else {
      console.warn('safeParseDataPoints: Invalid point array structure discarded', result.error.issues);
      return [];
    }
  } catch (err) {
    console.warn('safeParseDataPoints: Failed to parse JSON, discarded corrupted points data', err);
    return [];
  }
}

/**
 * Safely parses and validates spectral peaks from a JSON string.
 * If invalid or unparseable, discards corrupted peak data and returns an empty array.
 */
export function safeParsePeaks(rawJson: string | null | undefined): SpectrumPeak[] {
  if (!rawJson || typeof rawJson !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(rawJson);
    const result = SpectrumPeaksArraySchema.safeParse(parsed);
    if (result.success) {
      return result.data as SpectrumPeak[];
    } else {
      console.warn('safeParsePeaks: Invalid peak array structure discarded', result.error.issues);
      return [];
    }
  } catch (err) {
    console.warn('safeParsePeaks: Failed to parse peaks JSON, discarded corrupted peaks data', err);
    return [];
  }
}

/**
 * Safely parses and validates a list of user spectrum records (e.g. from localStorage).
 * Discards individual malformed items rather than crashing the whole application.
 */
export function safeParseUserRecords(rawJson: string | null | undefined): SpectrumRecord[] {
  if (!rawJson || typeof rawJson !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      console.warn('safeParseUserRecords: Expected array in localStorage, received', typeof parsed);
      return [];
    }

    const validRecords: SpectrumRecord[] = [];
    for (const item of parsed) {
      const result = SpectrumRecordSchema.safeParse(item);
      if (result.success) {
        // Also ensure dataPointsJson is valid points
        const points = safeParseDataPoints(result.data.dataPointsJson);
        if (points.length > 0) {
          validRecords.push(result.data as SpectrumRecord);
        } else {
          console.warn('safeParseUserRecords: Discarding record with empty or invalid dataPointsJson', item?.id);
        }
      } else {
        console.warn('safeParseUserRecords: Discarding invalid spectrum record', result.error.issues);
      }
    }

    return validRecords;
  } catch (err) {
    console.warn('safeParseUserRecords: Malformed localStorage JSON data, resetting user records', err);
    return [];
  }
}
