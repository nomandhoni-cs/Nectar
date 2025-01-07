export const SUCCESS_PATTERNS = {
  classNames: ["success", "discount-applied", "coupon-valid", "promo-applied"],
  textContent: ["discount applied", "coupon accepted", "promo code applied"],
  selectors: [
    '[class*="success"]',
    '[class*="discount"]',
    '[data-testid*="coupon-success"]',
    '[aria-label*="coupon applied"]',
  ],
};
