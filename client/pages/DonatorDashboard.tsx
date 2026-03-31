import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MyDonationTurn from "@/components/MyDonationTurn";
import { Heart, Calendar, CheckCircle2, History, ArrowRight } from "lucide-react";

export default function DonatorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "donator") {
      navigate("/login");
    }
  }, [navigate]);

  const features = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Browse Institutions",
      description: "Discover and apply to join charitable institutions",
      status: "Available",
      href: "/institutions",
      isActive: true,
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "My Turn Schedule",
      description: "See when it's your turn to donate",
      status: "Available",
      isActive: true,
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Confirm Donations",
      description: "Accept turns and confirm donation completion",
      status: "Coming Soon",
    },
    {
      icon: <History className="h-6 w-6" />,
      title: "Donation History",
      description: "View your donation records and impact",
      status: "Coming Soon",
    },
  ];

  return (
    <Layout>
      <div className="khair-container py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Donator Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Join institutions and donate on your scheduled turns
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Joined Institutions", value: "0" },
            { label: "Pending Applications", value: "0" },
            { label: "Next Turn", value: "—" },
            { label: "Total Donations", value: "0" },
          ].map((stat) => (
            <div key={stat.label} className="khair-card text-center">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* My Donation Turn */}
        <div className="mb-12">
          <MyDonationTurn token={localStorage.getItem("token") || ""} />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`khair-card transition-all ${
                "href" in feature
                  ? "hover:shadow-md cursor-pointer hover:border-primary"
                  : "hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    feature.isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {feature.icon}
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    feature.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-secondary/20 text-secondary-foreground"
                  }`}
                >
                  {feature.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>

              {"href" in feature && (
                <Link
                  to={feature.href}
                  className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:gap-3 transition-all"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="khair-card bg-primary/5 border-primary/20 mt-12">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg mb-2">Welcome to KhairConnect</h3>
            <p className="text-muted-foreground mb-4">
              Your donator dashboard is ready! Soon, you'll be able to browse institutions,
              apply to join, and manage your donation schedule through our fair rotation system.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for all the features that will help you make a difference.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
