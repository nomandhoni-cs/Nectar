import Gun from "gun";

// Initialize Gun.js with relay peers
const gun = Gun({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
});

export default defineBackground(() => {
  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === "NEW_COUPON") {
      const { website, coupon } = message;

      // Ensure website node exists
      const websiteNode = gun.get("websites").get(website);

      // Add coupon to the database
      const couponId = `coupon_${Date.now()}`;
      websiteNode
        .get("coupons")
        .get(couponId)
        .put({
          ...coupon,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      console.log(`Coupon added to ${website}:`, coupon);
    }
  });
});
