export interface InvoiceLineItemDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceDto {
  id: number;
  bookingId: number;
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  lineItems: InvoiceLineItemDto[];
}
