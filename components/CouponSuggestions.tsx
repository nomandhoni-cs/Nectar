import { useState, useEffect } from "react";
import {
  initGun,
  subscribeToCoupons,
  updateCouponData,
} from "@/lib/utils/gunUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Copy, CopyIcon, Triangle } from "lucide-react";

// Initialize Gun
const gun = initGun();

interface Coupon {
  code: string;
  description: string;
  expiration: string;
  status: string;
  upvoteCount: number;
  downvoteCount: number;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

const CouponSuggestions = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentWebsite, setCurrentWebsite] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    expiration: "",
  });

  useEffect(() => {
    // Get the current tab URL
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentWebsite(url.hostname);

        // Clear existing coupons when website changes
        setCoupons([]);

        // Subscribe to coupons for the current website
        const websiteNode = gun
          .get("websites")
          .get(url.hostname)
          .get("coupons");

        websiteNode.map().on((coupon, code) => {
          if (coupon) {
            setCoupons((prev) => {
              // Remove existing coupon with same code if exists
              const filtered = prev.filter((c) => c.code !== code);
              // Add the updated coupon
              return [
                ...filtered,
                {
                  ...coupon,
                  code,
                  // Ensure numeric values
                  upvoteCount: Number(coupon.upvoteCount) || 0,
                  downvoteCount: Number(coupon.downvoteCount) || 0,
                },
              ];
            });
          }
        });

        // Return cleanup function
        return () => {
          websiteNode.off();
        };
      }
    });
  }, []);

  const addCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCoupon.code || !newCoupon.description) return;

    const couponData: Coupon = {
      ...newCoupon,
      status: "active",
      upvoteCount: 0,
      downvoteCount: 0,
      addedBy: "anonymousUser",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: "",
      contributorUserID: "",
      categories: [],
      termsAndConditions: "",
      isVerified: false,
    };

    // Save to Gun.js database with explicit node creation
    const couponNode = gun
      .get("websites")
      .get(currentWebsite)
      .get("coupons")
      .get(couponData.code);

    // Set each property individually to ensure proper data types
    Object.entries(couponData).forEach(([key, value]) => {
      couponNode.get(key).put(value);
    });

    // Reset form
    setNewCoupon({ code: "", description: "", expiration: "" });
    setShowAddForm(false);
  };

  const applyCoupon = async (code: string) => {
    await browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]?.id) {
          browser.tabs.sendMessage(tabs[0].id, { type: "APPLY_COUPON", code });
        }
      });
  };
  const handleUpvote = (coupon: Coupon) => {
    gun
      .get("websites")
      .get(currentWebsite)
      .get("coupons")
      .get(coupon.code)
      .get("upvoteCount")
      .once((currentCount) => {
        // Convert to number and increment
        const newCount = (Number(currentCount) || 0) + 1;
        // Set the new count
        gun
          .get("websites")
          .get(currentWebsite)
          .get("coupons")
          .get(coupon.code)
          .get("upvoteCount")
          .put(newCount);
      });
  };

  const handleDownvote = (coupon: Coupon) => {
    gun
      .get("websites")
      .get(currentWebsite)
      .get("coupons")
      .get(coupon.code)
      .get("downvoteCount")
      .once((currentCount) => {
        // Convert to number and increment
        const newCount = (Number(currentCount) || 0) + 1;
        // Set the new count
        gun
          .get("websites")
          .get(currentWebsite)
          .get("coupons")
          .get(coupon.code)
          .get("downvoteCount")
          .put(newCount);
      });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Coupon code copied to clipboard!");
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
          <form onSubmit={addCoupon} className="space-y-4">
            <Input
              placeholder="Code"
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, code: e.target.value })
              }
              required
            />
            <Textarea
              placeholder="Description"
              value={newCoupon.description}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, description: e.target.value })
              }
              required
            />
            <Input
              placeholder="Expiration (YYYY-MM-DD)"
              value={newCoupon.expiration}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, expiration: e.target.value })
              }
            />
            <Button type="submit" className="w-full">
              Save Coupon
            </Button>
          </form>
        ) : (
          <ScrollArea className="space-y-4 h-[400px]">
            {coupons.map((coupon) => (
              <div key={coupon.code} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>{coupon.code}</span>
                  <Button onClick={() => applyCoupon(coupon.code)}>
                    Try Code
                  </Button>
                </div>
                <p>{coupon.description}</p>
                <p>Expires: {coupon.expiration || "N/A"}</p>
                <p>Status: {coupon.status}</p>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpvote(coupon)}
                  >
                    Upvote
                    <Triangle direction="up" className="h-4 w-4" />{" "}
                    {coupon.upvoteCount}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownvote(coupon)}
                  >
                    Downvote{" "}
                    <Triangle direction="down" className="h-4 w-4 rotate-180" />{" "}
                    {coupon.downvoteCount}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(coupon.code)}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponSuggestions;
