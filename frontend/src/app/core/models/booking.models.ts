import type { RoomDto } from './room.models';
import type { BookingServiceDto } from './service.models';

export interface BookingDto {
  id: number;
  guestId: number;
  guestName: string;
  hotelId: number;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  cancellationFee: number;
  notes: string;
  guestCount: number;
  createdAt: string;
  rooms: RoomDto[];
  services: BookingServiceDto[];
}

export interface BookingServiceRequestDto {
  serviceId: number;
  quantity: number;
  serviceDate: string;
}

export interface CreateBookingDto {
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  roomIds: number[];
  services: BookingServiceRequestDto[];
  notes: string;
  guestCount: number;
}

export interface UpdateBookingDto {
  checkInDate: string;
  checkOutDate: string;
  roomIds: number[];
  guestCount: number;
  notes: string;
}

export interface AddBookingServiceDto {
  serviceId: number;
  quantity: number;
  serviceDate: string;
}
