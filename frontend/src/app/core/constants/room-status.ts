/** Matches API-serialised `RoomStatus` from the backend. */
export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'OutOfService';

export const ROOM_STATUSES: readonly RoomStatus[] = [
  'Available',
  'Occupied',
  'Cleaning',
  'OutOfService',
] as const;
