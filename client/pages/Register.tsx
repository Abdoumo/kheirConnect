import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { AlertCircle, Loader2 } from "lucide-react";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError(t("auth.register.validation.fillAllFields"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.register.validation.passwordMismatch"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("auth.register.validation.passwordLength"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: role,
          ...(role === "institution" && {
            description: formData.description,
            location: formData.location,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("auth.register.error"));
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
      setError(t("auth.register.errorMessage"));
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
            <h1 className="text-3xl font-bold mb-2">{t("auth.register.title")}</h1>
            <p className="text-muted-foreground">
              {t("auth.register.subtitle")}
            </p>
          </div>

          {step === 1 ? (
            // Step 1: Role Selection
            <div className="space-y-4">
              <p className="font-medium">{t("auth.register.chooseRole")}</p>

              {[

                {
                  icon: "🏢",
                  title: t("auth.register.institution.title"),
                  description: t("auth.register.institution.description"),
                  value: "institution",
                },
                {
                  icon: "🤝",
                  title: t("auth.register.donator.title"),
                  description: t("auth.register.donator.description"),
                  value: "donator",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRoleSelect(option.value)}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-colors text-left hover:bg-primary/5"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              <p className="text-center text-sm text-muted-foreground mt-6">
                {t("auth.register.haveAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline">
                  {t("auth.register.signIn")}
                </Link>
              </p>
            </div>
          ) : (
            // Step 2: Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  {t("auth.register.changeRole")}
                </button>
              </div>

              {error && (
                <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t("auth.register.form.fullName")}
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t("auth.register.form.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Institution-specific fields */}
              {role === "institution" && (
                <>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      {t("auth.register.form.description")}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Tell us about your institution..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-2">
                      {t("auth.register.form.location")}
                    </label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="City, Country"
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  {t("auth.register.form.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("auth.register.form.passwordHint")}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  {t("common.confirm")}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
                    {t("auth.register.form.institutionSubmit")}
                  </>
                ) : (
                  role === "institution"
                    ? t("auth.register.form.institutionSubmit")
                    : t("auth.register.form.donatorSubmit")
                )}
              </button>

              {/* Sign In Link */}
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.register.haveAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline">
                  {t("auth.register.signIn")}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
