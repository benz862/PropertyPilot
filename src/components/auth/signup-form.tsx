"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      window.location.assign("/dashboard");
      return;
    }
    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <Alert variant="success" title="Check your email">
        We sent a confirmation link to {email}. Confirm your account, then you&apos;ll be taken to your PropertyPilot workspace.
      </Alert>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert variant="error" title="Account creation failed">{error}</Alert>}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
