import { useState, useEffect } from "react";
import Gun from "gun";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "./ui/scroll-area";

// Initialize Gun
const gun = Gun({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
});

interface Coupon {
  code: string;
  description: string;
  success_rate: number;
  last_verified: string;
  website: string;
}

const CouponSuggestions = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentWebsite, setCurrentWebsite] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
  });

  useEffect(() => {
    // Get current tab URL
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentWebsite(url.hostname);

        // Subscribe to coupons for this website
        gun
          .get("coupons")
          .get(url.hostname)
          .map()
          .on((coupon, id) => {
            if (coupon) {
              setCoupons((prev) => {
                const exists = prev.some((c) => c.code === coupon.code);
                if (!exists) {
                  return [...prev, coupon];
                }
                return prev;
              });
            }
          });
      }
    });
  }, []);

  const applyCoupon = async (code: string) => {
    await browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]?.id) {
          browser.tabs.sendMessage(tabs[0].id, {
            type: "APPLY_COUPON",
            code,
          });
        }
      });
  };

  const submitCoupon = (code: string, success: boolean) => {
    gun
      .get("coupons")
      .get(currentWebsite)
      .get(code)
      .put({
        success_rate: success ? 1 : 0,
        last_verified: new Date().toISOString(),
      });
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCoupon.code || !newCoupon.description) {
      return;
    }

    const couponData: Coupon = {
      code: newCoupon.code,
      description: newCoupon.description,
      success_rate: 1,
      last_verified: new Date().toISOString(),
      website: currentWebsite,
    };

    // Save to Gun.js database
    gun.get("coupons").get(currentWebsite).get(newCoupon.code).put(couponData);

    // Reset form
    setNewCoupon({ code: "", description: "" });
    setShowAddForm(false);
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Coupons for {currentWebsite}</CardTitle>
          <Button
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "Add Coupon"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Coupon Code
              </label>
              <Input
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="Enter coupon code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={newCoupon.description}
                onChange={(e) =>
                  setNewCoupon((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="What discount does this coupon provide?"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Save Coupon
            </Button>
          </form>
        ) : (
          <>
            {coupons.length === 0 ? (
              <p className="text-gray-500">
                No coupons available for this site
              </p>
            ) : (
              <ScrollArea className="space-y-4 h-[400px]">
                {coupons.map((coupon) => (
                  <div key={coupon.code} className="border p-4 rounded-lg my-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => applyCoupon(coupon.code)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Try Code
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {coupon.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Success rate: {(coupon.success_rate * 100).toFixed(1)}%
                      <br />
                      Last verified:{" "}
                      {new Date(coupon.last_verified).toLocaleDateString()}
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submitCoupon(coupon.code, true)}
                      >
                        👍 Worked
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submitCoupon(coupon.code, false)}
                      >
                        👎 Failed
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponSuggestions;
