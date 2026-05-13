export interface PaymentDto {
  id: number;
  bookingId: number;
  amount: number;
  method: string;
  status: string;
  transactionRef: string;
  processedAt: string;
}
