import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { CheckCircle2, XCircle, Users, Building2, Loader2 } from "lucide-react";

interface Institution {
  _id: string;
  name: string;
  description: string;
  location: string;
  approved: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "admin") {
      navigate("/login");
      return;
    }

    fetchInstitutions();
  }, [navigate]);

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/institutions", {
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

  const handleApprove = async (institutionId: string) => {
    setActionLoading(institutionId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/institutions/${institutionId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setInstitutions((prev) =>
          prev.map((inst) =>
            inst._id === institutionId ? { ...inst, approved: true } : inst
          )
        );
      }
    } catch (err) {
      console.error("Failed to approve institution:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (institutionId: string) => {
    setActionLoading(institutionId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/institutions/${institutionId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setInstitutions((prev) =>
          prev.filter((inst) => inst._id !== institutionId)
        );
      }
    } catch (err) {
      console.error("Failed to reject institution:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInstitutions = institutions.filter((inst) => {
    if (filter === "pending") return !inst.approved;
    if (filter === "approved") return inst.approved;
    return true;
  });

  return (
    <Layout>
      <div className="khair-container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage institutions and oversee the platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="khair-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Institutions</p>
                <p className="text-2xl font-bold">{institutions.length}</p>
              </div>
            </div>
          </div>

          <div className="khair-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {institutions.filter((i) => i.approved).length}
                </p>
              </div>
            </div>
          </div>

          <div className="khair-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {institutions.filter((i) => !i.approved).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {["pending", "approved", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                filter === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Institutions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "No pending institutions"
                : filter === "approved"
                  ? "No approved institutions"
                  : "No institutions yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInstitutions.map((institution) => (
              <div key={institution._id} className="khair-card">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{institution.name}</h3>
                      {institution.approved ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {institution.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      📍 {institution.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Registered: {new Date(institution.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!institution.approved && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(institution._id)}
                        disabled={actionLoading === institution._id}
                        className="khair-button-primary text-sm py-2 px-4 disabled:opacity-50"
                      >
                        {actionLoading === institution._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(institution._id)}
                        disabled={actionLoading === institution._id}
                        className="khair-button-outline text-sm py-2 px-4 disabled:opacity-50"
                      >
                        {actionLoading === institution._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
