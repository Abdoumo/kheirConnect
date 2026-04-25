import { Link } from "react-router-dom";
import { ArrowRight, Users, RotateCw, Bell, Heart, CheckCircle2, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import InstitutionsMap from "@/components/InstitutionsMap";

export default function Index() {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              {t("home.hero.emoji")} {t("home.hero.title")}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            {t("home.hero.subtitle")}
            <span className="text-primary"></span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("home.hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/register"
              className="khair-button-primary w-full sm:w-auto"
            >
              {t("home.hero.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="khair-button-outline w-full sm:w-auto"
            >
              {t("home.hero.ctaAlt")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.features.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t("home.features.items", { returnObjects: true }).map((feature: { title: string; description: string }, idx: number) => {
            const icons = [
              <RotateCw className="h-6 w-6" />,
              <Bell className="h-6 w-6" />,
              <Users className="h-6 w-6" />,
              <CheckCircle2 className="h-6 w-6" />,
              <Heart className="h-6 w-6" />,
              <Zap className="h-6 w-6" />,
            ];
            return (
              <div key={idx} className="khair-card group hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {icons[idx]}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Institutions Map Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.map.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.map.description")}
          </p>
        </div>

        <div className="w-full">
          <InstitutionsMap token={localStorage.getItem("token") || ""} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.howItWorks.title")}</h2>
          <p className="text-lg text-muted-foreground">
            {t("home.howItWorks.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {t("home.howItWorks.steps", { returnObjects: true }).map((title: string, idx: number) => (
            <div key={idx} className="flex gap-6 items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Roles Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.userRoles.title")}</h2>
          <p className="text-lg text-muted-foreground">
            {t("home.userRoles.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: "🏢",
              title: t("home.userRoles.institution.title"),
              description: t("home.userRoles.institution.description"),
              features: t("home.userRoles.institution.features", { returnObjects: true }),
            },
            {
              icon: "🤝",
              title: t("home.userRoles.donator.title"),
              description: t("home.userRoles.donator.description"),
              features: t("home.userRoles.donator.features", { returnObjects: true }),
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
                {role.features.map((feature: string, fidx: number) => (
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
                {t("home.userRoles.cta", { role: role.title })}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="khair-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.security.title")}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("home.security.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {t("home.security.features", { returnObjects: true }).map((label: string, idx: number) => {
                const icons = ["🔐", "🔑", "✅"];
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{icons[idx]}</span>
                    <span className="font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="khair-container py-20 sm:py-32">
        <div className="khair-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("home.cta.title")}</h2>
            <p className="text-lg mb-8 opacity-90">
              {t("home.cta.description")}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary-foreground text-primary font-semibold hover:shadow-lg transition-all"
            >
              {t("home.cta.button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
