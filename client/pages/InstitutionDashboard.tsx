import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import WeeklyNeeds from "@/components/WeeklyNeeds";
import DonationTurns from "@/components/DonationTurns";
import LocationPicker from "@/components/LocationPicker";
import { Building2, Users, Calendar, FileText, Loader2, Check, X, MapPin } from "lucide-react";

interface Donator {
  _id: string;
  name: string;
  email: string;
}

interface Institution {
  _id: string;
  name: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  activeDonators: number;
  pendingApplications: number;
  pendingDonators: Donator[];
  donators: Donator[];
}

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "institution") {
      navigate("/login");
      return;
    }

    fetchInstitution();
  }, [navigate]);

  const fetchInstitution = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/institution/my-institution", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched institution:", data);
        setInstitution(data);
      }
    } catch (err) {
      console.error("Failed to fetch institution:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDonator = async (donatorId: string) => {
    try {
      setApprovingId(donatorId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/institution/donators/${donatorId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchInstitution();
      }
    } catch (err) {
      console.error("Failed to approve donator:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectDonator = async (donatorId: string) => {
    try {
      setRejectingId(donatorId);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/institution/donators/${donatorId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchInstitution();
      }
    } catch (err) {
      console.error("Failed to reject donator:", err);
    } finally {
      setRejectingId(null);
    }
  };

  const handleSaveLocation = async (lat: number, lng: number) => {
    try {
      setSavingLocation(true);
      const token = localStorage.getItem("token");
      console.log("Saving location:", { lat, lng });

      const response = await fetch("/api/institution/location", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      console.log("Save response status:", response.status);
      const responseData = await response.json();
      console.log("Save response data:", responseData);

      if (response.ok) {
        console.log("Location saved successfully, fetching updated institution");
        await fetchInstitution();
        setShowLocationPicker(false);
      } else {
        console.error("Failed to save location:", responseData);
        alert(`Error: ${responseData.message || "Failed to save location"}`);
      }
    } catch (err) {
      console.error("Failed to save location:", err);
      alert("Error saving location: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSavingLocation(false);
    }
  };

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Manage Donators",
      description: "View and approve donator applications",
      status: "Active",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Weekly Needs",
      description: "Post and manage your weekly donation needs",
      status: "Active",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Donation Turns",
      description: "Assign and track donation rotation turns",
      status: "Active",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Reports",
      description: "View donation history and analytics",
      status: "Coming Soon",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="khair-container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="khair-container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Institution Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage your donators and coordinate weekly donations
          </p>
        </div>

        {/* Location Section */}
        {institution && (
          <div className="mb-12">
            <div className="khair-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Location</h2>
                    <p className="text-sm text-muted-foreground">{institution.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationPicker(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Edit on Map
                </button>
              </div>
              {institution.latitude && institution.longitude && (
                <p className="text-xs text-muted-foreground">
                  Coordinates: {institution.latitude.toFixed(4)}, {institution.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Location Picker Modal */}
        {showLocationPicker && institution && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background">
                <h3 className="text-xl font-bold">Set Institution Location</h3>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <LocationPicker
                  initialLat={institution.latitude || 36.737}
                  initialLng={institution.longitude || 3.086}
                  onSave={handleSaveLocation}
                  loading={savingLocation}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Active Donators", value: institution?.activeDonators || "0" },
            { label: "Pending Applications", value: institution?.pendingApplications || "0" },
            { label: "This Week's Turn", value: "—" },
            { label: "Total Donations", value: "0" },
          ].map((stat) => (
            <div key={stat.label} className="khair-card text-center">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Pending Applications Section */}
        {institution && institution.pendingApplications > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Pending Applications</h2>
            <div className="space-y-4">
              {institution.pendingDonators.map((donator) => (
                <div
                  key={donator._id}
                  className="khair-card flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{donator.name}</p>
                    <p className="text-sm text-muted-foreground">{donator.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveDonator(donator._id)}
                      disabled={approvingId === donator._id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      {approvingId === donator._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectDonator(donator._id)}
                      disabled={rejectingId === donator._id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      {rejectingId === donator._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Donators Section */}
        {institution && institution.activeDonators > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Active Donators</h2>
            <div className="space-y-4">
              {institution.donators.map((donator) => (
                <div
                  key={donator._id}
                  className="khair-card flex items-start justify-between"
                >
                  <div>
                    <p className="font-semibold">{donator.name}</p>
                    <p className="text-sm text-muted-foreground">{donator.email}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Needs Section */}
        <div className="mb-12">
          <WeeklyNeeds token={localStorage.getItem("token") || ""} />
        </div>

        {/* Donation Turns Section */}
        <div className="mb-12">
          <DonationTurns
            token={localStorage.getItem("token") || ""}
            activeDonators={institution?.donators || []}
          />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature) => (
            <div key={feature.title} className="khair-card hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  feature.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-secondary/20 text-secondary-foreground"
                }`}>
                  {feature.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="khair-card bg-primary/5 border-primary/20 mt-12">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg mb-2">Get Started</h3>
            <p className="text-muted-foreground mb-4">
              Your institution dashboard is ready! You can now manage your donators and post weekly needs.
              More features are coming soon.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
