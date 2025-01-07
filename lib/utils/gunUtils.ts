import Gun from "gun";
import { Coupon, Vote } from "../types";

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

export type VoteType = "upvote" | "downvote" | "withdraw";

export const handleVote = async (
  gun: Gun,
  website: string,
  couponCode: string,
  userId: string,
  voteType: VoteType
) => {
  const couponNode = gun
    .get("websites")
    .get(website)
    .get("coupons")
    .get(couponCode);

  const votesNode = couponNode.get("votes");

  return new Promise((resolve) => {
    votesNode.get(userId).once((existingVote: Vote | undefined) => {
      if (voteType === "withdraw") {
        if (!existingVote) {
          resolve({ success: false, message: "No vote to withdraw" });
          return;
        }

        // Decrease the appropriate count
        const countType =
          existingVote.voteType === "upvote" ? "upvoteCount" : "downvoteCount";
        couponNode.get(countType).once((count: number) => {
          couponNode.get(countType).put(Math.max(0, getGunNumber(count) - 1));
        });

        // Remove the vote
        votesNode.get(userId).put(null);
        resolve({ success: true, message: "Vote withdrawn" });
        return;
      }

      // Check if user has already voted
      if (existingVote) {
        // User has already voted
        if (existingVote.voteType === voteType) {
          resolve({ success: false, message: "You've already voted" });
          return;
        }

        // Update vote counts based on vote change
        if (voteType === "upvote") {
          couponNode.get("upvoteCount").once((count: number) => {
            couponNode.get("upvoteCount").put(getGunNumber(count) + 1);
          });
          couponNode.get("downvoteCount").once((count: number) => {
            couponNode
              .get("downvoteCount")
              .put(Math.max(0, getGunNumber(count) - 1));
          });
        } else {
          couponNode.get("downvoteCount").once((count: number) => {
            couponNode.get("downvoteCount").put(getGunNumber(count) + 1);
          });
          couponNode.get("upvoteCount").once((count: number) => {
            couponNode
              .get("upvoteCount")
              .put(Math.max(0, getGunNumber(count) - 1));
          });
        }
      } else {
        // New vote
        const countType =
          voteType === "upvote" ? "upvoteCount" : "downvoteCount";
        couponNode.get(countType).once((count: number) => {
          couponNode.get(countType).put(getGunNumber(count) + 1);
        });
      }

      // Record the vote
      votesNode.get(userId).put({
        userId,
        voteType,
        timestamp: new Date().toISOString(),
      });

      resolve({ success: true, message: "Vote recorded" });
    });
  });
};

export const getUserVote = async (
  gun: Gun,
  website: string,
  couponCode: string,
  userId: string
): Promise<Vote | null> => {
  return new Promise((resolve) => {
    gun
      .get("websites")
      .get(website)
      .get("coupons")
      .get(couponCode)
      .get("votes")
      .get(userId)
      .once((vote: Vote | undefined) => {
        resolve(vote || null);
      });
  });
};
