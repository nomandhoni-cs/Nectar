import Gun from "gun";

// Initialize Gun
const gun = Gun({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
});

export default defineBackground(() => {
  // Listen for messages from content script
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === "NEW_COUPON") {
      const { website, code, description } = message;

      // Add coupon to the database
      gun.get("coupons").get(website).get(code).put({
        code,
        description,
        success_rate: 1,
        last_verified: new Date().toISOString(),
        website,
      });
    }
  });
});
