// services/gunDB.ts
import Gun from "gun";
import { Website, Coupon, CouponFormData, IGunInstance } from "@/lib/types";
import { logger } from "./logger";

export class CouponDatabase {
  private gun: IGunInstance;
  private websites: any;

  constructor() {
    logger.info("Initializing CouponDatabase");
    try {
      this.gun = Gun({
        peers: ["https://gun-manhattan.herokuapp.com/gun"],
        // localStorage: false, // Disable localStorage to prevent conflicts
        web: true, // Enable WebRTC for peer-to-peer connections
      });
      this.websites = this.gun.get("websites");
      logger.info("Gun initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Gun:", error);
      throw error;
    }
  }

  async addWebsite(domain: string, name: string, url: string): Promise<void> {
    logger.info("Adding website:", { domain, name, url });
    return new Promise((resolve, reject) => {
      try {
        const websiteData: Partial<Website> = {
          name,
          url,
          coupons: {},
        };

        this.websites.get(domain).put(websiteData, (ack: any) => {
          if (ack.err) {
            logger.error("Error adding website:", ack.err);
            reject(ack.err);
          } else {
            logger.info("Website added successfully:", domain);
            resolve();
          }
        });
      } catch (error) {
        logger.error("Failed to add website:", error);
        reject(error);
      }
    });
  }

  async addCoupon(domain: string, formData: CouponFormData): Promise<string> {
    logger.info("Adding coupon for domain:", domain, formData);
    const couponId = `coupon_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const couponData: Coupon = {
      ...formData,
      status: "active",
      lastUsed: new Date().toISOString(),
      upvoteCount: 0,
      downvoteCount: 0,
      addedBy: "anonymous",
      contributorUserID: `user_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      isVerified: false,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      try {
        const couponRef = this.websites
          .get(domain)
          .get("coupons")
          .get(couponId);
        couponRef.put(couponData, (ack: any) => {
          if (ack.err) {
            logger.error("Error adding coupon:", ack.err);
            reject(ack.err);
          } else {
            logger.info("Coupon added successfully:", couponId);
            resolve(couponId);
          }
        });
      } catch (error) {
        logger.error("Failed to add coupon:", error);
        reject(error);
      }
    });
  }

  subscribeToCoupons(
    domain: string,
    callback: (coupons: Record<string, Coupon>) => void
  ): () => void {
    logger.info("Subscribing to coupons for domain:", domain);

    const listener = (data: any, couponId: string) => {
      if (data && typeof data === "object") {
        logger.debug("Received coupon update:", { couponId, data });
        callback({ [couponId]: data as Coupon });
      }
    };

    this.websites.get(domain).get("coupons").map().on(listener);

    // Return unsubscribe function
    return () => {
      logger.info("Unsubscribing from coupons for domain:", domain);
      this.websites.get(domain).get("coupons").map().off(listener);
    };
  }

  async getCoupons(domain: string): Promise<Record<string, Coupon>> {
    logger.info("Getting coupons for domain:", domain);
    return new Promise((resolve, reject) => {
      try {
        const coupons: Record<string, Coupon> = {};

        this.websites
          .get(domain)
          .get("coupons")
          .map()
          .once((data: any, couponId: string) => {
            if (data && typeof data === "object") {
              logger.debug("Found coupon:", { couponId, data });
              coupons[couponId] = data as Coupon;
            }
          })
          .then(() => {
            logger.info(
              "Retrieved coupons successfully:",
              Object.keys(coupons).length
            );
            resolve(coupons);
          });
      } catch (error) {
        logger.error("Failed to get coupons:", error);
        reject(error);
      }
    });
  }

  async voteCoupon(
    domain: string,
    couponId: string,
    isUpvote: boolean
  ): Promise<void> {
    logger.info("Voting coupon:", { domain, couponId, isUpvote });
    return new Promise((resolve, reject) => {
      try {
        const voteField = isUpvote ? "upvoteCount" : "downvoteCount";

        this.websites
          .get(domain)
          .get("coupons")
          .get(couponId)
          .get(voteField)
          .once((currentCount: any) => {
            const newCount =
              (typeof currentCount === "number" ? currentCount : 0) + 1;
            logger.debug("Updating vote count:", { currentCount, newCount });

            this.websites
              .get(domain)
              .get("coupons")
              .get(couponId)
              .get(voteField)
              .put(newCount, (ack: any) => {
                if (ack.err) {
                  logger.error("Error updating vote:", ack.err);
                  reject(ack.err);
                } else {
                  logger.info("Vote updated successfully");
                  resolve();
                }
              });
          });
      } catch (error) {
        logger.error("Failed to vote coupon:", error);
        reject(error);
      }
    });
  }
}

export const couponDB = new CouponDatabase();
