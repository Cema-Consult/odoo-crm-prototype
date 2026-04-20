"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-[380px] bg-surface border border-border rounded-lg p-8 space-y-5">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /><span className="font-semibold">CRM Studio</span></div>
      <div>
        <div className="text-lg font-medium">Welcome back</div>
        <div className="text-sm text-text-muted">Sign in to your workspace</div>
      </div>
      <div className="space-y-3">
        <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="demo@crm.studio" /></div>
        <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
      </div>
      <button
        type="button"
        className="text-xs text-text-muted hover:text-text"
        onClick={() => { setEmail("demo@crm.studio"); setPassword("demo"); }}
      >Use demo credentials</button>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
