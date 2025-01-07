import { SUCCESS_PATTERNS } from "@/lib/constants/couponPatterns";
import { sanitizeWebsiteData } from "@/lib/utils/privacy";

export default defineContentScript({
  matches: ["*://*/*"],
  async main(ctx) {
    // Listen for messages from popup
    browser.runtime.onMessage.addListener(async (message) => {
      if (message.type === "APPLY_COUPON") {
        try {
          // Find coupon input field (this will need to be customized per website)
          const couponInput = document.querySelector(
            '[name="coupon"], [id*="coupon"], [class*="coupon"]'
          );
          if (couponInput instanceof HTMLInputElement) {
            // Fill in the coupon code
            couponInput.value = message.code;

            // Trigger change event
            couponInput.dispatchEvent(new Event("change", { bubbles: true }));

            // Find and click apply button
            const applyButton = Array.from(
              document.querySelectorAll("button")
            ).find(
              (button) =>
                button.textContent?.toLowerCase().includes("apply") ||
                button.textContent?.toLowerCase().includes("coupon")
            );

            if (applyButton) {
              applyButton.click();
            }
          }
        } catch (error) {
          console.error("Error applying coupon:", error);
        }
      }
    });

    const checkCouponSuccess = (): boolean => {
      // Check class-based selectors
      const classMatch = SUCCESS_PATTERNS.selectors.some((selector) =>
        document.querySelector(selector)
      );
      if (classMatch) return true;

      // Check text content
      const textMatch = SUCCESS_PATTERNS.textContent.some((text) =>
        document.body.innerText.toLowerCase().includes(text)
      );

      return textMatch;
    };

    // Update the mutation observer to use the new success check
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && checkCouponSuccess()) {
          // Report successful coupon application with sanitized data
          const websiteData = sanitizeWebsiteData(window.location.href);
          browser.runtime.sendMessage({
            type: "COUPON_SUCCESS",
            website: websiteData.domain,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});
