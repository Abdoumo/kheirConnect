import { useState, useEffect } from "react";
import { Loader2, Heart, AlertCircle, CheckCircle, XCircle, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WeeklyNeed {
  _id: string;
  title: string;
  description: string;
  urgency: string;
}

interface ApprovedInstitution {
  _id: string;
  name: string;
  description: string;
  location: string;
  donatorCount: number;
  weeklyNeeds: WeeklyNeed[];
  createdAt: string;
}

interface ConfirmDonationsProps {
  token: string;
}

export default function ConfirmDonations({ token }: ConfirmDonationsProps) {
  const [institutions, setInstitutions] = useState<ApprovedInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmedNeeds, setConfirmedNeeds] = useState<Map<string, string>>(new Map());
  const [declinedNeeds, setDeclinedNeeds] = useState<Set<string>>(new Set());

  // Modal states
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<WeeklyNeed | null>(null);
  const [donationType, setDonationType] = useState<"all" | "specific">("all");
  const [specificDonation, setSpecificDonation] = useState("");

  useEffect(() => {
    fetchApprovedInstitutions();
    fetchSavedConfirmations();
  }, []);

  const fetchApprovedInstitutions = async () => {
    try {
      const response = await fetch("/api/donator/approved-institutions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error("Failed to fetch approved institutions:", err);
    }
  };

  const fetchSavedConfirmations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/donation-confirmations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const confirmed = new Map<string, string>();
        const declined = new Set<string>();

        data.forEach((confirmation: any) => {
          if (confirmation.status === "confirmed") {
            confirmed.set(confirmation.weeklyNeedId._id, confirmation.donationDetails);
          } else if (confirmation.status === "declined") {
            declined.add(confirmation.weeklyNeedId._id);
          }
        });

        setConfirmedNeeds(confirmed);
        setDeclinedNeeds(declined);
      }
    } catch (err) {
      console.error("Failed to fetch saved confirmations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = (need: WeeklyNeed) => {
    setSelectedNeed(need);
    setDonationType("all");
    setSpecificDonation("");
    setDonateModalOpen(true);
  };

  const handleConfirmDonate = async () => {
    if (!selectedNeed) return;

    const donationDetails =
      donationType === "all" ? `All items: ${selectedNeed.title}` : specificDonation;

    try {
      // Find institution ID for this need
      const institution = institutions.find((inst) =>
        inst.weeklyNeeds.some((need) => need._id === selectedNeed._id)
      );

      if (!institution) {
        console.error("Institution not found for this need");
        return;
      }

      const response = await fetch("/api/donation-confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          institutionId: institution._id,
          weeklyNeedId: selectedNeed._id,
          needTitle: selectedNeed.title,
          status: "confirmed",
          donationDetails,
        }),
      });

      if (response.ok) {
        setConfirmedNeeds((prev) => new Map(prev).set(selectedNeed._id, donationDetails));
        setDeclinedNeeds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedNeed._id);
          return newSet;
        });
      }
    } catch (err) {
      console.error("Failed to save donation confirmation:", err);
    }

    setDonateModalOpen(false);
    setSelectedNeed(null);
  };

  const handleDeclineClick = (need: WeeklyNeed) => {
    setSelectedNeed(need);
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!selectedNeed) return;

    try {
      // Find institution ID for this need
      const institution = institutions.find((inst) =>
        inst.weeklyNeeds.some((need) => need._id === selectedNeed._id)
      );

      if (!institution) {
        console.error("Institution not found for this need");
        return;
      }

      const response = await fetch("/api/donation-confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          institutionId: institution._id,
          weeklyNeedId: selectedNeed._id,
          needTitle: selectedNeed.title,
          status: "declined",
          donationDetails: "",
        }),
      });

      if (response.ok) {
        setDeclinedNeeds((prev) => new Set([...prev, selectedNeed._id]));
        setConfirmedNeeds((prev) => {
          const newMap = new Map(prev);
          newMap.delete(selectedNeed._id);
          return newMap;
        });
      }
    } catch (err) {
      console.error("Failed to save donation decline:", err);
    }

    setDeclineModalOpen(false);
    setSelectedNeed(null);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "regular":
      case "quotidien":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "🔴";
      case "high":
        return "🟠";
      case "regular":
      case "quotidien":
        return "🔵";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="khair-card text-center py-8">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground">
          You haven't been approved to any institutions yet. Apply to institutions and wait for
          approval!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Confirm Donations</h2>

      {institutions.map((institution) => (
        <div key={institution._id} className="khair-card border-l-4 border-l-primary">
          {/* Institution Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">{institution.name}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              {institution.location}
            </div>
            <p className="text-muted-foreground text-sm">{institution.description}</p>
          </div>

          {/* Current Needs */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-4">Current Needs</h4>

            {institution.weeklyNeeds.length === 0 ? (
              <div className="p-4 bg-secondary/10 rounded-lg text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No current needs specified
              </div>
            ) : (
              <div className="space-y-3">
                {institution.weeklyNeeds.map((need) => {
                  const isConfirmed = confirmedNeeds.has(need._id);
                  const isDeclined = declinedNeeds.has(need._id);

                  return (
                    <div
                      key={need._id}
                      className={`p-4 rounded-lg border transition-all ${
                        isConfirmed
                          ? "bg-green-50 border-green-200"
                          : isDeclined
                            ? "bg-red-50 border-red-200"
                            : "bg-secondary/5 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h5 className="font-semibold">{need.title}</h5>
                            <span className={`text-sm font-semibold mt-0.5 ${getUrgencyColor(need.urgency)}`}>
                              {getUrgencyIcon(need.urgency)} {need.urgency === "quotidien" ? "Regular" : need.urgency}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">{need.description}</p>

                          {/* Show confirmed donation details if confirmed */}
                          {isConfirmed && (
                            <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                              <strong>✓ You will donate:</strong> {confirmedNeeds.get(need._id)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!isConfirmed && !isDeclined && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmClick(need)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            <CheckCircle className="h-4 w-4" />
                            I can do
                          </button>
                          <button
                            onClick={() => handleDeclineClick(need)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            <XCircle className="h-4 w-4" />
                            Can't do
                          </button>
                        </div>
                      )}

                      {/* Show status if already selected */}
                      {(isConfirmed || isDeclined) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setConfirmedNeeds((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(need._id);
                                return newMap;
                              });
                              setDeclinedNeeds((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(need._id);
                                return newSet;
                              });
                            }}
                            className="flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm border border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            Change Answer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="pt-6 border-t border-border">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-green-600">
                  {Array.from(confirmedNeeds.keys()).filter((id) =>
                    institution.weeklyNeeds.some((n) => n._id === id)
                  ).length}
                </span>
                <span className="text-muted-foreground ml-1">can do</span>
              </div>
              <div>
                <span className="font-semibold text-red-600">
                  {Array.from(declinedNeeds).filter((id) =>
                    institution.weeklyNeeds.some((n) => n._id === id)
                  ).length}
                </span>
                <span className="text-muted-foreground ml-1">can't do</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Donate Modal */}
      <Dialog open={donateModalOpen} onOpenChange={setDonateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">How would you like to donate?</DialogTitle>
            <DialogDescription>
              {selectedNeed?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup value={donationType} onValueChange={(value) => setDonationType(value as "all" | "specific")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50"
                onClick={() => setDonationType("all")}>
                <RadioGroupItem value="all" id="donate-all" />
                <Label htmlFor="donate-all" className="flex-1 cursor-pointer">
                  <span className="font-medium">Donate all items</span>
                  <p className="text-xs text-muted-foreground">
                    Provide the complete list: {selectedNeed?.title}
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50"
                onClick={() => setDonationType("specific")}>
                <RadioGroupItem value="specific" id="donate-specific" />
                <Label htmlFor="donate-specific" className="flex-1 cursor-pointer">
                  <span className="font-medium">Donate specific items</span>
                  <p className="text-xs text-muted-foreground">
                    Specify what you can donate
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {donationType === "specific" && (
              <div className="space-y-2">
                <Label htmlFor="donation-details">What will you donate?</Label>
                <Textarea
                  id="donation-details"
                  placeholder="E.g., khobz w maa (bread and water), only 5 portions..."
                  value={specificDonation}
                  onChange={(e) => setSpecificDonation(e.target.value)}
                  className="min-h-24"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDonateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDonate}
              disabled={donationType === "specific" && !specificDonation.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Donation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Modal */}
      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-red-600">Are you sure?</DialogTitle>
            <DialogDescription>
              You're declining to donate: <strong>{selectedNeed?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Don't you want some Ajr?</span>
                <br />
                <span className="text-xs mt-2 inline-block">
                  Helping those in need brings great spiritual rewards (Ajr). Consider donating if you can!
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeclineModalOpen(false)}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Reconsider - I'll donate
            </Button>
            <Button
              onClick={handleConfirmDecline}
              variant="destructive"
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
