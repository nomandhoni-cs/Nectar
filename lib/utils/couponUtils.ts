import { Coupon } from "../types";

export const validateCoupon = (coupon: Coupon): boolean => {
  const now = new Date();
  const expirationDate = new Date(coupon.expiration);

  return (
    coupon.status === "active" &&
    expirationDate > now &&
    coupon.upvoteCount > coupon.downvoteCount
  );
};

export const sortCoupons = (coupons: Coupon[]): Coupon[] => {
  return coupons.sort((a, b) => {
    // First prioritize verified coupons
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }

    // Then consider vote ratio
    const aRatio = a.upvoteCount / (a.upvoteCount + a.downvoteCount || 1);
    const bRatio = b.upvoteCount / (b.upvoteCount + b.downvoteCount || 1);

    return bRatio - aRatio;
  });
};

export const generateCouponId = (): string => {
  return `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
