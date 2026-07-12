"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Truck, ShieldAlert, LayoutDashboard, UserCheck, Wrench } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hackathon Q&A Highlight: 
  // We provide a quick-select for the judges to evaluate RBAC without typing,
  // while still routing through the secure NextAuth credentials provider.
  const handleRoleSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword("password123");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      // This will catch our exact "Invalid credentials. Account locked after 5 failed attempts." string from the DB
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Panel - Branding (Dark Mode aesthetic per mockup) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Truck className="w-8 h-8 text-slate-900" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TransitOps</h1>
          </div>
          <h2 className="text-4xl font-medium text-white leading-tight mb-6">
            Smart Transport <br /> Operations Platform
          </h2>
          <div className="space-y-4 text-slate-400">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>Fleet Manager</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5" />
              <span>Dispatcher</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" />
              <span>Safety Officer</span>
            </div>
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5" />
              <span>Financial Analyst</span>
            </div>
          </div>
        </div>
        <div className="text-slate-500 text-sm">
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-gray-500">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            
            {/* Quick Role Selector for Hackathon Demo */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Role (Auto-fill)
              </label>
              <select 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                onChange={(e) => handleRoleSelect(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select a role to test...</option>
                <option value="fleet_manager@transitops.com">Fleet Manager</option>
                <option value="dispatcher@transitops.com">Dispatcher</option>
                <option value="safety_officer@transitops.com">Safety Officer</option>
                <option value="financial_analyst@transitops.com">Financial Analyst</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="dispatcher@transitops.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-amber-600 hover:text-amber-700">Forgot password?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}