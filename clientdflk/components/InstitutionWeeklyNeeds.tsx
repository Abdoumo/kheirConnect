import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface WeeklyNeed {
  _id: string;
  title: string;
  description: string;
  urgency: "urgent" | "quotidien";
  createdAt: string;
}

interface InstitutionWeeklyNeedsProps {
  institutionId: string;
  token: string;
}

export default function InstitutionWeeklyNeeds({
  institutionId,
  token,
}: InstitutionWeeklyNeedsProps) {
  const [needs, setNeeds] = useState<WeeklyNeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyNeeds();
  }, [institutionId]);

  const fetchWeeklyNeeds = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/institutions/${institutionId}/weekly-needs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNeeds(data);
      }
    } catch (err) {
      console.error("Failed to fetch weekly needs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  if (needs.length === 0) {
    return null; // Don't show section if no needs
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Current Needs</h4>
      <div className="space-y-2">
        {needs.map((need) => (
          <div
            key={need._id}
            className="p-3 bg-secondary/20 rounded-lg space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{need.title}</p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  need.urgency === "urgent"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {need.urgency === "urgent" ? "🔴 Urgent" : "🔵 Regular"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{need.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
