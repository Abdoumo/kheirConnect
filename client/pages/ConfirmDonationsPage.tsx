import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ConfirmDonations from "@/components/ConfirmDonations";
import { ArrowLeft } from "lucide-react";

export default function ConfirmDonationsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "donator") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Layout>
      <div className="khair-container py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/donator")}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Page Content */}
        <ConfirmDonations token={localStorage.getItem("token") || ""} />
      </div>
    </Layout>
  );
}
