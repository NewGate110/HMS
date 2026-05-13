export interface ApiError {
  status: number;
  message: string;
  raw?: unknown;
}
