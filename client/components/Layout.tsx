import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: t("layout.navigation.home"), public: true },
    { href: "/login", label: t("layout.navigation.login"), public: true, hideWhenLoggedIn: true },
    { href: "/register", label: t("layout.navigation.register"), public: true, hideWhenLoggedIn: true },
  ];

  const dashboardLinks = isLoggedIn
    ? [
        userRole === "admin" && { href: "/admin", label: t("layout.navigation.adminDashboard") },
        userRole === "institution" && {
          href: "/institution",
          label: t("layout.navigation.institutionDashboard"),
        },
        userRole === "donator" && { href: "/donator", label: t("layout.navigation.donatorDashboard") },
      ].filter(Boolean)
    : [];

  const allLinks = [...dashboardLinks, ...navLinks].filter(
    (link) => !link.hideWhenLoggedIn || !isLoggedIn
  );

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="khair-container flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png"  className="max-w-[32px]"  alt="logo"  />
            <span className="hidden text-xl font-bold text-foreground sm:inline">
              {t("layout.brand")}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="ml-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.logout")}</span>
              </button>
            )}
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <LogOut className="h-5 w-5 text-destructive" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card md:hidden">
            <nav className="khair-container space-y-2 py-4">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="khair-container py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                  <img src="/logo.png"  className="max-w-[32px]" alt="logo"  />
                <span className="text-lg font-bold">{t("layout.brand")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("layout.tagline")}
              </p>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-semibold mb-4">{t("layout.footer.platform")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    {t("layout.footer.links.0")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("layout.footer.links.1")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">{t("layout.footer.resources")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    {t("layout.footer.links.2")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    {t("layout.footer.links.3")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{t("layout.footer.legal")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    {t("layout.footer.links.4")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    {t("layout.footer.links.5")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>{t("layout.footer.copyright", { year: new Date().getFullYear() })}</p>
            <p>{t("layout.footer.tagline")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
