"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.push("/chat");
    } catch (err: any) {
      setError(err?.message || "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto relative flex min-h-dvh items-center justify-center p-6 animate-fadeIn">
      {/* Brand */}
      <Link
        href="/"
        className="absolute left-6 top-6 font-bold text-primary hover:text-primary-gold transition-colors"
      >
        Akili
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg dark:bg-neutral-900 dark:border-neutral-800">
        <h1 className="mb-2 text-3xl font-semibold text-center text-primary">
          Log in
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              className="focus-visible:ring-primary-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              className="focus-visible:ring-primary-gold"
            />
            <div className="mt-1 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <Button
            className="w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Logging in...
              </span>
            ) : (
              "Log in"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
