import { useState, useEffect } from "react";
import { Loader2, ChevronRight, AlertCircle } from "lucide-react";

interface DonationTurn {
  _id: string;
  donatorId: string;
  donatorName: string;
  donatorEmail: string;
  week: number;
  status: "pending" | "accepted" | "completed" | "declined";
}

interface Donator {
  _id: string;
  name: string;
  email: string;
}

interface DonationTurnsProps {
  token: string;
  activeDonators: Donator[];
}

export default function DonationTurns({
  token,
  activeDonators,
}: DonationTurnsProps) {
  const [turns, setTurns] = useState<DonationTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<DonationTurn | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchTurns();
  }, []);

  const fetchTurns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/institution/donation-turns", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTurns(data);
      }

      // Get current turn
      const currentResponse = await fetch(
        "/api/institution/donation-turns/current",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentTurn(currentData);
      }
    } catch (err) {
      console.error("Failed to fetch donation turns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTurn = async (donatorId: string) => {
    try {
      setAssigning(donatorId);
      const response = await fetch(
        `/api/institution/donation-turns/${donatorId}/assign`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchTurns();
      }
    } catch (err) {
      console.error("Failed to assign turn:", err);
    } finally {
      setAssigning(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      declined: "bg-red-100 text-red-700",
    };

    const labels: Record<string, string> = {
      pending: "⏳ Pending",
      accepted: "✅ Accepted",
      completed: "✔️ Completed",
      declined: "❌ Declined",
    };

    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Donation Rotation</h2>

      {/* Current Turn */}
      {currentTurn && currentTurn._id && (
        <div className="khair-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-6">
          <h3 className="font-semibold text-lg mb-4">This Week's Donor</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-xl">{currentTurn.donatorName}</p>
              <p className="text-sm text-muted-foreground">{currentTurn.donatorEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">Week {currentTurn.week}</p>
            </div>
            <div>{getStatusBadge(currentTurn.status)}</div>
          </div>
        </div>
      )}

      {/* Quick Assign Section */}
      {activeDonators.length > 0 && (
        <div className="khair-card space-y-4">
          <h3 className="font-semibold text-lg">Quick Assign Next Turn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeDonators.map((donator) => (
              <button
                key={donator._id}
                onClick={() => handleAssignTurn(donator._id)}
                disabled={assigning === donator._id}
                className="p-3 text-left border border-input rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium text-sm">{donator.name}</p>
                  <p className="text-xs text-muted-foreground">{donator.email}</p>
                </div>
                {assigning === donator._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Turns */}
      {turns.length > 0 && (
        <div className="khair-card space-y-4">
          <h3 className="font-semibold text-lg">Rotation History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {turns.map((turn) => (
              <div
                key={turn._id}
                className="p-3 bg-secondary/20 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{turn.donatorName}</p>
                  <p className="text-xs text-muted-foreground">Week {turn.week}</p>
                </div>
                {getStatusBadge(turn.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Donators State */}
      {activeDonators.length === 0 && (
        <div className="khair-card text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            No active donators yet. Approve donator applications to start rotation.
          </p>
        </div>
      )}
    </div>
  );
}
