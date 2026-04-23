import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DonationTurn {
  _id: string;
  institutionName: string;
  institutionLocation: string;
  week: number;
  weeklyNeeds: string;
  status: string;
}

interface MyDonationTurnProps {
  token: string;
}

export default function MyDonationTurn({ token }: MyDonationTurnProps) {
  const [turn, setTurn] = useState<DonationTurn | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMyTurn();
  }, []);

  const fetchMyTurn = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/donator/donation-turn", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data._id) {
          setTurn(data);
        } else {
          setTurn(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch donation turn:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!turn?._id) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/donation-turns/${turn._id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchMyTurn();
      }
    } catch (err) {
      console.error("Failed to accept turn:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!turn?._id) return;

    if (
      !window.confirm(
        "Are you sure you want to decline? Your turn will be passed to the next donator."
      )
    ) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/donation-turns/${turn._id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchMyTurn();
      }
    } catch (err) {
      console.error("Failed to decline turn:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!turn) {
    return (
      <div className="khair-card text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground">
          You don't have a donation turn scheduled. Browse institutions and apply to join!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Donation Turn</h2>

      <div className="khair-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Your Turn at</h3>
          <div>
            <p className="text-2xl font-bold">{turn.institutionName}</p>
            <p className="text-sm text-muted-foreground">{turn.institutionLocation}</p>
          </div>
        </div>

        {/* Week Info */}
        <div className="p-4 bg-secondary/20 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-1">Week</p>
          <p className="text-3xl font-bold">{turn.week}</p>
        </div>

        {/* Weekly Needs */}
        {turn.weeklyNeeds && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Institution's Needs This Week</p>
            <div className="p-3 bg-secondary/20 rounded-lg text-sm">
              {turn.weeklyNeeds}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
          <div className="flex items-center gap-2">
            {turn.status === "pending" ? (
              <>
                <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
                <span className="font-medium">Awaiting your response</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Accepted</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {turn.status === "pending" && (
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Will you donate this week?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Yes, I'll Donate
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Can't Donate
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              If you decline, your turn will automatically be passed to the next donator.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="khair-card bg-blue-50 border-blue-200 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          How the Rotation Works
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• You're part of a rotation with other donators</li>
          <li>• When it's your turn, you'll receive a notification</li>
          <li>• You can accept to donate or decline to skip</li>
          <li>• If you decline, it automatically goes to the next donator</li>
          <li>• The rotation continues until all donators complete their turns</li>
        </ul>
      </div>
    </div>
  );
}
