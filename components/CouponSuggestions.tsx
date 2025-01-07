import React, { useState, useEffect } from "react";
import {
  initGun,
  subscribeToCoupons,
  updateCouponData,
  getUserVote,
  handleVote,
} from "@/lib/utils/gunUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Copy, CopyIcon, Triangle } from "lucide-react";
import { Vote } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [userVotes, setUserVotes] = useState<Record<string, Vote>>({});
  const [userData, setUserData] = useState<{
    userId: string;
    username: string;
  }>();
  const [date, setDate] = React.useState<Date>();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const data = await browser.storage.local.get(["userId", "username"]);
      if (data.userId && data.username) {
        setUserData(data);
      }
    };
    loadUserData();
  }, []);

  // Load user votes when coupons change
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!userData?.userId || !currentWebsite) return;

      const votes: Record<string, Vote> = {};
      for (const coupon of coupons) {
        const vote = await getUserVote(
          gun,
          currentWebsite,
          coupon.code,
          userData.userId
        );
        if (vote) {
          votes[coupon.code] = vote;
        }
      }
      setUserVotes(votes);
    };

    loadUserVotes();
  }, [coupons, currentWebsite, userData?.userId]);

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

  const handleVoteClick = async (
    coupon: Coupon,
    voteType: "upvote" | "downvote"
  ) => {
    if (!userData?.userId) {
      alert("Please log in to vote");
      return;
    }

    const result = await handleVote(
      gun,
      currentWebsite,
      coupon.code,
      userData.userId,
      voteType
    );

    if (!result.success) {
      alert(result.message);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Coupon code copied to clipboard!");
  };

  const handleWithdrawVote = async (coupon: Coupon) => {
    if (!userData?.userId) {
      alert("Please log in to manage votes");
      return;
    }

    const result = await handleVote(
      gun,
      currentWebsite,
      coupon.code,
      userData.userId,
      "withdraw"
    );

    if (!result.success) {
      alert(result.message);
    }
  };

  const renderVoteButtons = (coupon: Coupon) => {
    const userVote = userVotes[coupon.code];

    return (
      <div className="flex space-x-2 mt-2">
        <Button
          variant={userVote?.voteType === "upvote" ? "default" : "outline"}
          size="sm"
          onClick={() => handleVoteClick(coupon, "upvote")}
          disabled={userVote?.voteType === "downvote"}
        >
          <Triangle className="h-4 w-4" /> {coupon.upvoteCount}
        </Button>
        <Button
          variant={userVote?.voteType === "downvote" ? "default" : "outline"}
          size="sm"
          onClick={() => handleVoteClick(coupon, "downvote")}
          disabled={userVote?.voteType === "upvote"}
        >
          <Triangle className="h-4 w-4 rotate-180" /> {coupon.downvoteCount}
        </Button>
        {userVote && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleWithdrawVote(coupon)}
          >
            Withdraw Vote
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(coupon.code)}
        >
          <CopyIcon className="h-4 w-4" />
        </Button>
      </div>
    );
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
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP")
                    ) : (
                      <span>Pick an expiration date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      if (newDate) {
                        setNewCoupon({
                          ...newCoupon,
                          expiration: newDate.toISOString(),
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                {renderVoteButtons(coupon)}
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponSuggestions;
