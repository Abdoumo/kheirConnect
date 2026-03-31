import { useState, useEffect } from "react";
import { Loader2, Heart, AlertCircle, CheckCircle, XCircle, MapPin } from "lucide-react";

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
  const [confirmedNeeds, setConfirmedNeeds] = useState<Set<string>>(new Set());
  const [declinedNeeds, setDeclinedNeeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApprovedInstitutions();
  }, []);

  const fetchApprovedInstitutions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/donator/approved-institutions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error("Failed to fetch approved institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNeed = (needId: string) => {
    setConfirmedNeeds((prev) => new Set([...prev, needId]));
    setDeclinedNeeds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(needId);
      return newSet;
    });
  };

  const handleDeclineNeed = (needId: string) => {
    setDeclinedNeeds((prev) => new Set([...prev, needId]));
    setConfirmedNeeds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(needId);
      return newSet;
    });
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
          You haven't been approved to any institutions yet. Apply to institutions and wait for approval!
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
                            <span className={`text-xs font-semibold mt-1 ${getUrgencyColor(need.urgency)}`}>
                              {need.urgency === "quotidien" ? "🔵 Regular" : need.urgency}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">{need.description}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmNeed(need._id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                            isConfirmed
                              ? "bg-green-200 text-green-800"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          I Can Do This
                        </button>
                        <button
                          onClick={() => handleDeclineNeed(need._id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                            isDeclined
                              ? "bg-red-200 text-red-800"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          Can't Do This
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="pt-6 border-t border-border">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold text-green-600">
                  {confirmedNeeds.size > 0
                    ? Array.from(confirmedNeeds).filter((id) =>
                        institution.weeklyNeeds.some((n) => n._id === id)
                      ).length
                    : 0}
                </span>
                <span className="text-muted-foreground ml-1">can do</span>
              </div>
              <div>
                <span className="font-semibold text-red-600">
                  {declinedNeeds.size > 0
                    ? Array.from(declinedNeeds).filter((id) =>
                        institution.weeklyNeeds.some((n) => n._id === id)
                      ).length
                    : 0}
                </span>
                <span className="text-muted-foreground ml-1">can't do</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
