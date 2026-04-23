import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

interface WeeklyNeed {
  _id: string;
  title: string;
  description: string;
  urgency: "urgent" | "quotidien";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyNeedsProps {
  token: string;
}

export default function WeeklyNeeds({ token }: WeeklyNeedsProps) {
  const [needs, setNeeds] = useState<WeeklyNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "quotidien" as "urgent" | "quotidien",
  });

  useEffect(() => {
    fetchWeeklyNeeds();
  }, []);

  const fetchWeeklyNeeds = async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/institution/weekly-needs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();
    console.log("RAW WEEKLY NEEDS:", text);

    if (!response.ok) {
      console.error("Server error:", text);
      return;
    }

    const data = JSON.parse(text);
    setNeeds(data);

  } catch (err) {
    console.error("Failed to fetch weekly needs:", err);
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        // Update existing
        const response = await fetch(`/api/institution/weekly-needs/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          await fetchWeeklyNeeds();
          resetForm();
        }
      } else {
        // Create new
        const response = await fetch("/api/institution/weekly-needs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          await fetchWeeklyNeeds();
          resetForm();
        }
      }
    } catch (err) {
      console.error("Failed to save weekly need:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (need: WeeklyNeed) => {
    setFormData({
      title: need.title,
      description: need.description,
      urgency: need.urgency,
    });
    setEditingId(need._id);
    setShowForm(true);
  };

  const handleDelete = async (needId: string) => {
    if (!window.confirm("Are you sure you want to delete this weekly need?")) {
      return;
    }

    try {
      setDeleting(needId);
      const response = await fetch(`/api/institution/weekly-needs/${needId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchWeeklyNeeds();
      }
    } catch (err) {
      console.error("Failed to delete weekly need:", err);
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", urgency: "quotidien" });
    setEditingId(null);
    setShowForm(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weekly Needs</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Need
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="khair-card space-y-4">
          <h3 className="font-semibold text-lg">
            {editingId ? "Edit Weekly Need" : "Create Weekly Need"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Food supplies needed"
                className="w-full px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the need in detail..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Urgency Level *</label>
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    urgency: e.target.value as "urgent" | "quotidien",
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="quotidien">Quotidien (Regular)</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Need"
                ) : (
                  "Create Need"
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Needs List */}
      {needs.length === 0 ? (
        <div className="khair-card text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            No weekly needs posted yet. Create one to let donors know what you need.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {needs.map((need) => (
            <div key={need._id} className="khair-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{need.title}</h4>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                      need.urgency === "urgent"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {need.urgency === "urgent" ? "🔴 Urgent" : "🔵 Quotidien"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{need.description}</p>
              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => handleEdit(need)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(need._id)}
                  disabled={deleting === need._id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {deleting === need._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
