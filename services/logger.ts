// services/logger.ts
export const logger = {
  debug: (...args: any[]) => {
    console.debug("[Coupon Extension Debug]:", ...args);
  },
  info: (...args: any[]) => {
    console.info("[Coupon Extension Info]:", ...args);
  },
  error: (...args: any[]) => {
    console.error("[Coupon Extension Error]:", ...args);
  },
};
