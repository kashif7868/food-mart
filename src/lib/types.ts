/* =========================================================
   FOODMART API TYPES (match the backend models)
========================================================= */

export type ID = string;

export type ProfileType = "BUYER" | "CHEF" | "LOCAL_POINT" | "RESTAURANT" | "BLOGGER";
export type MembershipRole = "OWNER" | "MANAGER" | "EDITOR" | "ORDER_STAFF" | "ANALYST";
export type GlobalRole = string; // SUPER_ADMIN, ADMIN, MODERATOR or a custom team role key

/* Dashboard "workspace" the user is currently acting as */
export type DashboardRole = "admin" | "restaurant" | "chef" | "food-point" | "blogger" | "customer";

export interface MediaRef {
  asset?: ID;
  url: string;
  thumbnailUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT";
  isPrimary?: boolean;
}

export interface User {
  _id: ID;
  name: string;
  email: string;
  phone?: string;
  avatar?: { url?: string };
  globalRoles: GlobalRole[];
  /* Request to join the FoodMart team (panel sign-up) */
  teamRequest?: { status: "PENDING" | "REJECTED"; note?: string; requestedAt?: string; reason?: string } | null;
  status: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface SellerSettings {
  acceptsOrders: boolean;
  offersPickup: boolean;
  offersDelivery: boolean;
  deliveryFee: number;
  minimumOrder: number;
  serviceRadiusKm: number;
  averagePrepMinutes: number;
}

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Profile {
  _id: ID;
  profileType: ProfileType;
  slug: string;
  displayName: string;
  bio?: string;
  avatar?: { url?: string };
  cover?: { url?: string };
  status: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  contact?: Record<string, string>;
  address?: { line1?: string; area?: string; city?: string; region?: string; countryCode?: string };
  location?: { type: "Point"; coordinates: [number, number] };
  locationIsApproximate?: boolean;
  cuisines?: string[];
  ratings?: { food: RatingSummary; restaurant: RatingSummary; seller: RatingSummary };
  stats?: Record<string, number>;
  awards?: { badgeCode: string; title: string; rankNo: number; awardedAt: string }[];
  sellerSettings?: SellerSettings;
  openingHours?: OpeningHour[];
  specialties?: string[];
  experienceYears?: number;
  isHomeChef?: boolean;
  businessName?: string;
  pointKind?: string;
  legalName?: string;
  priceLevel?: number;
  collaborationStatus?: "OPEN" | "CLOSED";
  disclosureText?: string;
  audienceCity?: string;
  createdAt?: string;
}

export interface MyProfile {
  profile: Pick<Profile, "_id" | "displayName" | "slug" | "profileType" | "avatar" | "status" | "verificationStatus">;
  role: MembershipRole;
  capabilities: string[];
}

export interface FoodCategory {
  _id: ID;
  name: string;
  slug: string;
  parent?: ID | null;
  isActive?: boolean;
  sortOrder?: number;
  children?: FoodCategory[];
}

export interface Food {
  _id: ID;
  seller: ID | Partial<Profile>;
  sellerType: ProfileType;
  category: ID | { _id: ID; name: string; slug: string };
  name: string;
  slug: string;
  description?: string;
  cuisine?: string;
  tags?: string[];
  ingredients?: string[];
  price: number;
  currency: string;
  media: MediaRef[];
  isAvailable: boolean;
  isOrderable: boolean;
  availableQty: number | null;
  availability?: { days?: string[]; fromTime?: string; toTime?: string; specialDate?: string };
  prepMinutes?: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED" | "REMOVED";
  rating?: RatingSummary;
  stats?: { views: number; orders: number; favorites: number };
  orderableNow?: boolean;
  unavailableReason?: string;
}

export interface Deal {
  _id: ID;
  profile: ID | Partial<Profile>;
  title: string;
  description?: string;
  dealType: "PERCENT" | "FIXED";
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  foods: (ID | Partial<Food>)[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export type OrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED" | "REJECTED" | "CANCELLED";

export interface OrderItem {
  _id: ID;
  food?: ID | null;
  nameSnapshot: string;
  imageSnapshot?: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  note?: string;
}

export interface Order {
  _id: ID;
  orderNumber: string;
  buyer: ID | Partial<User>;
  seller: ID | Partial<Profile>;
  sellerType: ProfileType;
  sellerNameSnapshot?: string;
  items: OrderItem[];
  fulfillmentType: "PICKUP" | "DELIVERY";
  deliveryAddress?: Record<string, string>;
  contactPhone?: string;
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  status: OrderStatus;
  statusHistory: { from: string | null; to: string; actorType: string; reason?: string; at: string }[];
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  completedAt?: string;
  cancelReason?: string;
  rejectionReason?: string;
  allowedNextStatuses?: OrderStatus[];
  viewerRole?: "BUYER" | "SELLER" | "ADMIN";
  reviewEligibility?: {
    foodItems: { orderItemId: ID; foodId: ID; name: string; reviewed: boolean }[];
    service: { reviewType: "RESTAURANT" | "SELLER"; reviewed: boolean; reviewId: ID | null };
  } | null;
}

export interface Post {
  _id: ID;
  author: Partial<Profile> & { _id: ID };
  postType: "PHOTO" | "TEXT" | "REVIEW" | "PROMOTION" | "DAILY_SPECIAL" | "REEL";
  caption?: string;
  hashtags: string[];
  media: MediaRef[];
  linkedFood?: Partial<Food> | null;
  isSponsored: boolean;
  sponsoredLabel?: string;
  reel?: { url?: string; thumbnailUrl?: string; durationSeconds?: number; presetSeconds?: number; processingStatus: string; viewCount: number };
  status: "PUBLISHED" | "DRAFT" | "HIDDEN" | "DELETED";
  stats: { likes: number; comments: number; saves: number; shares: number; views: number; linkClicks?: number };
  createdAt: string;
  viewer?: { liked: boolean; saved: boolean };
}

export interface Review {
  _id: ID;
  reviewType: "FOOD" | "RESTAURANT" | "SELLER";
  user: { _id: ID; name: string; avatar?: { url?: string } };
  food?: { _id: ID; name: string } | null;
  profile?: Partial<Profile>;
  rating: number;
  title?: string;
  text?: string;
  media?: MediaRef[];
  status: string;
  isVerifiedPurchase: boolean;
  sellerReply?: { text?: string; repliedAt?: string };
  createdAt: string;
}

export interface Notification {
  _id: ID;
  type: string;
  title: string;
  body?: string;
  targetUrl?: string;
  readAt: string | null;
  createdAt: string;
}

export interface Promotion {
  _id: ID;
  restaurant: Partial<Profile> & { _id: ID };
  blogger: Partial<Profile> & { _id: ID };
  initiatedBy: "RESTAURANT" | "BLOGGER";
  title: string;
  brief?: string;
  deliverables: { _id: ID; kind: string; description: string; dueAt?: string; status: string; post?: Partial<Post> | ID | null }[];
  budget: number;
  currency: string;
  compensationNote?: string;
  startsAt?: string;
  endsAt?: string;
  status: string;
  dispute?: { reason?: string; resolution?: string };
  createdAt: string;
  updatedAt: string;
  viewer?: { sides: ("RESTAURANT" | "BLOGGER")[]; isAdmin: boolean };
}

export interface Paged<T> {
  items: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number; [key: string]: unknown };
}

export interface Cursor<T> {
  items: T[];
  nextCursor: string | null;
}

/* FoodMart team (admin panel) */
export interface TeamRoleRef {
  key: string;
  name: string;
  color?: string;
}
export interface TeamIdentity {
  roles: TeamRoleRef[];
  permissions: string[];
}

/* ---------- storefront ---------- */

export interface CartLine {
  foodId: ID;
  name?: string;
  image?: string | null;
  unitPrice?: number;
  quantity: number;
  note?: string;
  lineTotal?: number;
  available: boolean;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  deal: { _id: ID; title: string } | null;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
}

export interface CartView {
  _id: ID;
  seller: (Partial<Profile> & { _id: ID }) | null;
  items: CartLine[];
  issues: { foodId?: ID; message: string }[];
  fulfillmentOptions?: { pickup: boolean; delivery: boolean };
  totals: { pickup: CartTotals | null; delivery: CartTotals | null } | null;
  canCheckout: boolean;
}

export interface Recommendation {
  recommendationId: ID;
  reason: string;
  reasonCode: string;
  food: Food & { seller: Partial<Profile> };
}

export interface Address {
  _id: ID;
  label?: string;
  line1: string;
  area?: string;
  city: string;
  phone?: string;
  isDefault?: boolean;
}

export type ListingKind = "restaurants" | "chefs" | "food-points" | "bloggers";
