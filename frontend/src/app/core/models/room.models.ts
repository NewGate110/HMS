export interface RoomDto {
  id: number;
  hotelId: number;
  hotelName: string;
  roomNumber: string;
  type: string;
  capacity: number;
  priceOffPeak: number;
  pricePeak: number;
  status: string;
  description: string;
  floorNumber: number;
}

export interface RoomSearchResultItem {
  hotelId: number;
  hotelName: string;
  city: string;
  country: string;
  roomId: number;
  roomNumber: string;
  type: string;
  capacity: number;
  floorNumber: number;
  pricePerNight: number;
  description: string;
}

export interface RoomSearchResponse {
  results: RoomSearchResultItem[];
  totalCount: number;
}

export interface UpdateRoomPricingDto {
  priceOffPeak: number;
  pricePeak: number;
}
