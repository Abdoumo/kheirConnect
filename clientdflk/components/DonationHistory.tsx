import { useState, useEffect } from "react";
import { Loader2, Heart, AlertCircle, CheckCircle, Calendar, MapPin } from "lucide-react";

interface DonationRecord {
  _id: string;
  institutionId: string;
  institutionName: string;
  institutionLocation: string;
  week: number;
  weeklyNeeds: string;
  status: "accepted" | "completed";
  completedAt?: string;
  createdAt: string;
}

interface DonationHistoryProps {
  token: string;
}

export default function DonationHistory({ token }: DonationHistoryProps) {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/donator/donation-history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      }
    } catch (err) {
      console.error("Failed to fetch donation history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="khair-card text-center py-12">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground mb-2">No donation history yet</p>
        <p className="text-sm text-muted-foreground">
          Once you accept a donation turn, it will appear here.
          <br />
          Both ongoing and completed donations are tracked.
        </p>
      </div>
    );
  }

  const completedDonations = donations.filter((d) => d.status === "completed");
  const acceptedDonations = donations.filter((d) => d.status === "accepted");

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Donation History & Impact</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="khair-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed Donations</p>
              <p className="text-3xl font-bold text-green-600">{completedDonations.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="khair-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Institutions</p>
              <p className="text-3xl font-bold text-primary">
                {new Set(donations.map((d) => d.institutionId)).size}
              </p>
            </div>
            <Heart className="h-8 w-8 text-primary opacity-50" />
          </div>
        </div>
      </div>

      {/* Completed Donations */}
      {completedDonations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-green-600">
            ✓ Completed Donations ({completedDonations.length})
          </h3>
          <div className="space-y-3">
            {completedDonations.map((donation) => (
              <div key={donation._id} className="khair-card border-l-4 border-l-green-600 bg-green-50/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{donation.institutionName}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {donation.institutionLocation}
                    </div>
                  </div>
                  <div className="text-right">
                    <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                    <span className="text-xs font-medium text-green-600">Completed</span>
                  </div>
                </div>

                {donation.weeklyNeeds && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-medium mb-1">What was needed:</p>
                    <p className="text-sm text-muted-foreground">{donation.weeklyNeeds}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-green-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Week {donation.week}
                  </div>
                  <span>{formatDate(donation.completedAt || donation.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Donations */}
      {acceptedDonations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-600">
            ⏳ Accepted but Pending Completion ({acceptedDonations.length})
          </h3>
          <div className="space-y-3">
            {acceptedDonations.map((donation) => (
              <div key={donation._id} className="khair-card border-l-4 border-l-blue-600 bg-blue-50/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{donation.institutionName}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {donation.institutionLocation}
                    </div>
                  </div>
                  <div className="text-right">
                    <AlertCircle className="h-6 w-6 text-blue-600 mb-2 animate-pulse" />
                    <span className="text-xs font-medium text-blue-600">In Progress</span>
                  </div>
                </div>

                {donation.weeklyNeeds && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm font-medium mb-1">What's needed:</p>
                    <p className="text-sm text-muted-foreground">{donation.weeklyNeeds}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Week {donation.week}
                  </div>
                  <span>{formatDate(donation.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Message */}
      {completedDonations.length > 0 && (
        <div className="khair-card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-center py-8">
          <Heart className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Your Impact</h3>
          <p className="text-muted-foreground">
            Thank you for completing {completedDonations.length} donation{completedDonations.length !== 1 ? "s" : ""}!
            You've made a difference in the lives of those in need.
          </p>
        </div>
      )}
    </div>
  );
}
