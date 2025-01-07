// lib/types.ts
import Gun from "gun";

export type IGunInstance = ReturnType<typeof Gun>;

export interface Website {
  name: string;
  url: string;
  coupons: Record<string, Coupon>;
}

export interface Coupon {
  code: string;
  description: string;
  expiration: string;
  status: "active" | "expired" | "pending";
  lastUsed: string;
  upvoteCount: number;
  downvoteCount: number;
  addedBy: string;
  contributorUserID: string;
  createdAt: string;
  categories: string[];
  termsAndConditions: string;
  isVerified: boolean;
  updatedAt: string;
}

export interface CouponFormData {
  code: string;
  description: string;
  expiration: string;
  categories: string[];
  termsAndConditions: string;
}

export interface Vote {
  userId: string;
  voteType: "upvote" | "downvote";
  timestamp: string;
}

export interface CouponVotes {
  [couponId: string]: {
    [userId: string]: Vote;
  };
}
