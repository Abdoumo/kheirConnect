import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import InstitutionWeeklyNeeds from "@/components/InstitutionWeeklyNeeds";
import { MapPin, Users, Loader2, Heart } from "lucide-react";

interface Institution {
  _id: string;
  name: string;
  description: string;
  location: string;
  donatorCount: number;
  createdAt: string;
}

export default function BrowseInstitutions() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [applyingInstitutionId, setApplyingInstitutionId] = useState<string | null>(null);
  const [appliedInstitutions, setAppliedInstitutions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "donator") {
      navigate("/login");
      return;
    }

    fetchInstitutions();
  }, [navigate]);

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/institutions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJoin = async (institutionId: string) => {
    try {
      setApplyingInstitutionId(institutionId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/institutions/${institutionId}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAppliedInstitutions((prev) => new Set([...prev, institutionId]));
      } else {
        const error = await response.json();
        console.error("Failed to apply:", error);
      }
    } catch (err) {
      console.error("Failed to apply to institution:", err);
    } finally {
      setApplyingInstitutionId(null);
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="khair-container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Browse Institutions</h1>
          <p className="text-lg text-muted-foreground">
            Find and apply to join charitable institutions
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="text-center py-12 khair-card">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {institutions.length === 0
                ? "No institutions available yet"
                : "No institutions match your search"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((institution) => (
              <div
                key={institution._id}
                className="khair-card group hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {institution.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    {institution.location || "Location not specified"}
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {institution.description || "No description provided"}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {institution.donatorCount} donor{institution.donatorCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Weekly Needs */}
                <div className="mb-6">
                  <InstitutionWeeklyNeeds
                    institutionId={institution._id}
                    token={localStorage.getItem("token") || ""}
                  />
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleApplyToJoin(institution._id)}
                  disabled={applyingInstitutionId === institution._id || appliedInstitutions.has(institution._id)}
                  className="khair-button-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingInstitutionId === institution._id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Applying...
                    </>
                  ) : appliedInstitutions.has(institution._id) ? (
                    "Applied ✓"
                  ) : (
                    "Apply to Join"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {institutions.length > 0 && (
          <div className="khair-card bg-primary/5 border-primary/20 mt-12">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="font-semibold text-lg mb-2">How It Works</h3>
              <p className="text-muted-foreground mb-4">
                Browse approved institutions, select one that resonates with you, and apply to
                join. Once approved by the institution, you'll be added to their donation
                rotation system and receive notifications when it's your turn to donate.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
