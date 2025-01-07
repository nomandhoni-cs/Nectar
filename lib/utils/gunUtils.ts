import Gun from "gun";
import { Coupon } from "../types";

// Initialize Gun with proper configuration
export const initGun = () => {
  return Gun({
    peers: [
      "https://gun-manhattan.herokuapp.com/gun",
      // Add more peers for redundancy
    ],
    localStorage: true,
    web: true,
    radisk: true, // Enable radisk for better persistence
  });
};

// Utility function to safely get numeric values
export const getGunNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Utility function to safely update coupon data
export const updateCouponData = (
  gun: Gun,
  website: string,
  couponCode: string,
  data: Partial<Coupon>
) => {
  const couponNode = gun
    .get("websites")
    .get(website)
    .get("coupons")
    .get(couponCode);

  // Update each property individually
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "number") {
      couponNode.get(key).put(value);
    } else if (value !== undefined) {
      couponNode.get(key).put(value);
    }
  });
};

// Utility function to subscribe to coupon updates
export const subscribeToCoupons = (
  gun: Gun,
  website: string,
  callback: (coupons: Coupon[]) => void
) => {
  const websiteNode = gun.get("websites").get(website).get("coupons");

  const coupons = new Map<string, Coupon>();

  websiteNode.map().on((coupon, code) => {
    if (coupon) {
      coupons.set(code, {
        ...coupon,
        code,
        upvoteCount: getGunNumber(coupon.upvoteCount),
        downvoteCount: getGunNumber(coupon.downvoteCount),
      });

      callback(Array.from(coupons.values()));
    }
  });

  return () => websiteNode.off();
};
