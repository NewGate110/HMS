export interface OccupancyReportDto {
  hotelId: number;
  hotelName: string;
  from: string;
  to: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export interface RevenueReportDto {
  hotelId: number;
  hotelName: string;
  from: string;
  to: string;
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
}

export interface StaffPerformanceDto {
  staffId: number;
  fullName: string;
  department: string;
  role: string;
  bookingsCreated: number;
  checkIns: number;
  checkOuts: number;
}
