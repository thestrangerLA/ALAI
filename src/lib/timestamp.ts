import { Timestamp } from 'firebase/firestore';

/**
 * Converts various types of Firestore timestamps safely to a Javascript Date object.
 * @param timestamp The timestamp value to convert.
 * @returns A Date object or null if conversion fails.
 */
export function toDateSafe(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  // Handle plain objects that look like Timestamps (often happens during JSON serialization/deserialization)
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp.seconds === 'number') {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
  }
  return null;
}
