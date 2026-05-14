export interface HotelSummaryDto {
  id: number;
  name: string;
  city: string;
  country: string;
}

export interface HotelDto {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface UpdateHotelDto {
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}
