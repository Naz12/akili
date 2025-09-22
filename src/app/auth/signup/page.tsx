"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [region, setRegion] = React.useState("local");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ name, email, password, region });
      router.push("/chat");
    } catch (err: any) {
      setError(err?.message || "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto relative flex min-h-dvh items-center justify-center p-6">
      <Link href="/" className="absolute left-6 top-6 font-semibold">Akili</Link>
      <div className="w-full max-w-md rounded-lg border p-6">
        <h1 className="mb-1 text-2xl font-semibold">Sign up</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Already have an account? <Link href="/auth/login" className="underline">Log in</Link>
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Region</label>
            <Input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="local"
              required
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </form>
      </div>
    </main>
  );
}


