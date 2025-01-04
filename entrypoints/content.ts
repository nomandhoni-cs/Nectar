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

    // Watch for successful coupon applications
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          // Look for success messages (customize based on target websites)
          const successMessage = document.querySelector(
            '[class*="success"], [class*="discount-applied"]'
          );
          if (successMessage) {
            // Report successful coupon application
            browser.runtime.sendMessage({
              type: "COUPON_SUCCESS",
              website: window.location.hostname,
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});
