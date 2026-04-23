import { Link } from "react-router-dom";
import { ArrowRight, Users, RotateCw, Bell, Heart, CheckCircle2, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import InstitutionsMap from "@/components/InstitutionsMap";

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              🌟 Welcome to Wasstet Khir
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Coordinate Donations with
            <span className="text-primary"> Purpose</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern platform that connects donors with charitable institutions through
            fair, organized, and sustainable weekly rotation system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/register"
              className="khair-button-primary w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="khair-button-outline w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Core Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to coordinate charitable donations efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <RotateCw className="h-6 w-6" />,
              title: "Fair Rotation System",
              description:
                "Donations are assigned based on fair weekly rotation, ensuring each donor gets equal opportunities.",
            },
            {
              icon: <Bell className="h-6 w-6" />,
              title: "Smart Notifications",
              description:
                "Donors receive timely notifications when it's their turn to donate, with clear weekly needs.",
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: "Institution Management",
              description:
                "Manage donator applications, approve new members, and track donation activities.",
            },
            {
              icon: <CheckCircle2 className="h-6 w-6" />,
              title: "Donation Tracking",
              description:
                "Confirm donations, track completion status, and maintain detailed donation history.",
            },
            {
              icon: <Heart className="h-6 w-6" />,
              title: "Role-Based Access",
              description:
                "Separate dashboards for Admins, Institutions, and Donors with tailored functionality.",
            },
            {
              icon: <Zap className="h-6 w-6" />,
              title: "Instant Approval",
              description:
                "Streamlined approval workflows for institution registrations and donor applications.",
            },
          ].map((feature, idx) => (
            <div key={idx} className="khair-card group hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Institutions Map Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Find Institutions Near You</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore all registered charitable institutions on the map and join the ones in your area
          </p>
        </div>

        <div className="w-full">
          <InstitutionsMap />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            The donation rotation system explained
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              step: 1,
              title: "Institution Registers",
              description:
                "A charitable institution signs up with details about their mission and needs.",
            },
            {
              step: 2,
              title: "Admin Approves",
              description:
                "Admin reviews and approves the institution registration to activate their account.",
            },
            {
              step: 3,
              title: "Donors Join",
              description:
                "Donors apply to join institutions they wish to support. Institution reviews and approves.",
            },
            {
              step: 4,
              title: "Post Weekly Needs",
              description:
                "Institution posts their needs for the upcoming week to all approved donors.",
            },
            {
              step: 5,
              title: "Auto-Assign Turn",
              description:
                "System automatically assigns donation turn based on fair weekly rotation.",
            },
            {
              step: 6,
              title: "Donor Confirms",
              description:
                "Assigned donor receives notification, accepts the turn, and confirms completion.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">User Roles</h2>
          <p className="text-lg text-muted-foreground">
            Choose your role and get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: "🏢",
              title: "Institution",
              description: "Manage donors and coordinate weekly donations",
              features: [
                "Manage donor applications",
                "Post weekly needs",
                "Assign donation turns",
                "Track history",
              ],
            },
            {
              icon: "🤝",
              title: "Donator",
              description: "Join institutions and donate on your assigned turns",
              features: [
                "Browse institutions",
                "Apply to join",
                "See your turn schedule",
                "Confirm donations",
              ],
            },
          ].map((role, idx) => (
            <div
              key={idx}
              className="khair-card flex flex-col h-full hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="font-semibold text-xl mb-2">{role.title}</h3>
              <p className="text-muted-foreground mb-6 flex-1">{role.description}</p>
              <ul className="space-y-2 mb-6">
                {role.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="khair-button-primary text-center w-full"
              >
                Join as {role.title}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="khair-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Secure & Trustworthy</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your data and transactions are protected with industry-standard security measures.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: "🔐", label: "Encrypted Passwords" },
                { icon: "🔑", label: "JWT Authentication" },
                { icon: "✅", label: "Role-Based Access" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="khair-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Make an Impact?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join Wasstet Khir today and become part of a community committed to coordinated
              charitable giving.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary-foreground text-primary font-semibold hover:shadow-lg transition-all"
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
