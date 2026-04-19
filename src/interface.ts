export interface BookingItem {
  id?: string;
  hotelId: string;
  userId: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  guestsAdult: number;
  guestsChild: number;
  nights: number;
  totalPrice: number;
  createdAt?: string;
  userEmail?: string;
  userName?: string;
}

export interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  telephone?: string;
  password?: string;
  role?: string;
  defaultGuestsAdult?: number;
  defaultGuestsChild?: number;
  createdAt?: string;
  __v?: number;
}

export interface HotelSpecializations {
  location: string[];
  facility: string[];
  accessibility: string[];
}

export interface HotelItem {
  _id: string;
  id?: string;
  name: string;
  address: string;
  district: string;
  province: string;
  postalcode: string;
  region: string;
  tel: string;
  description: string;
  imgSrc?: string;
  price: number;
  specializations?: HotelSpecializations;
  __v?: number;
}

// CommentItem represents a single user review on a hotel
export interface CommentItem {
  _id: string;
  commentDate: string;
  userId: string | { _id?: string; id?: string; name?: string };
  hotelId: string;
  comment: string;
  rating: number; // 1–5 star rating selected by the user
}

interface BackendReferenceItem {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
}

interface BackendUserReferenceItem extends BackendReferenceItem {
  email?: string;
}

export interface HotelJson {
  success: boolean;
  count: number;
  pagination?: Record<string, unknown>;
  data: HotelItem[];
}

export interface SingleHotelJson {
  success: boolean;
  data: HotelItem;
}

export interface BackendBookingItem {
  _id?: string;
  __v?: number;
  createdAt?: string;
  guestsAdult: number;
  guestsChild: number;
  hotel: string | BackendReferenceItem;
  startDate: string;
  nights: number;
  roomNumber: string;
  totalPrice: number;
  user: string | BackendUserReferenceItem;
}

export interface BookingJson {
  success?: boolean;
  count?: number;
  data: BackendBookingItem[];
}

export interface SingleBookingJson {
  success?: boolean;
  data: BackendBookingItem;
}
