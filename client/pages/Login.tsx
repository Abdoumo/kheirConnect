import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("auth.login.error"));
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.userId);

      // Redirect based on role
      if (data.role === "admin") {
        navigate("/admin");
      } else if (data.role === "institution") {
        navigate("/institution");
      } else {
        navigate("/donator");
      }
    } catch (err) {
      setError(t("auth.login.errorMessage"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="khair-container min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("auth.login.title")}</h1>
            <p className="text-muted-foreground">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {/* Demo Info Card */}
          <div className="khair-card bg-primary/5 border-primary/20 mb-6">
            <p className="text-sm font-medium mb-2">{t("auth.login.demoLabel")}</p>
            <p className="text-sm text-muted-foreground">
              <strong>{t("auth.login.email")}:</strong> admin@khairconnect.com<br />
              <strong>{t("auth.login.password")}:</strong> Admin@123
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t("auth.login.emailPlaceholder")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t("auth.login.passwordPlaceholder")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="khair-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("auth.login.signingIn")}
                </>
              ) : (
                t("auth.login.submitButton")
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {t("auth.login.noAccount")}
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="khair-button-outline w-full text-center"
          >
            {t("auth.login.createAccount")}
          </Link>

          {/* Back to Home */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="text-primary hover:underline">
              {t("auth.login.backToHome")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
