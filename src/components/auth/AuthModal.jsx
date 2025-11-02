/**
 * Authentication Modal Component
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Loader2, Mail, Lock, User } from "lucide-react";
import { AuthService } from "@/lib/auth";

export function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000)
        );
        
        const signupPromise = AuthService.signUp(email, password, fullName);
        const result = await Promise.race([signupPromise, timeoutPromise]);
        
        if (result.ok) {
          if (result.session) {
            // User is signed in immediately (auto-confirm enabled)
            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1500);
          } else {
            // Email confirmation required
            setSuccess("Account created! Please check your email to verify, then sign in.");
            setTimeout(() => {
              setMode("signin");
              setEmail(email); // Keep email for sign in
              setSuccess("");
            }, 3000);
          }
        } else {
          const errorMsg = result.error || "Failed to create account";
          // Check if it's a database error (but account was still created)
          if (errorMsg.toLowerCase().includes("database") || 
              errorMsg.toLowerCase().includes("profile") ||
              errorMsg.toLowerCase().includes("constraint") ||
              errorMsg.toLowerCase().includes("may have been created") ||
              errorMsg.toLowerCase().includes("trigger")) {
            // Account was created but profile setup had issues - still show success
            setSuccess("Account may have been created. Try signing in - your account should work.");
            setTimeout(() => {
              setMode("signin");
              setEmail(email);
              setSuccess("");
            }, 3000);
          } else {
            setError(errorMsg);
          }
        }
      } else {
        const result = await AuthService.signIn(email, password);
        if (result.ok) {
          setSuccess("Signed in successfully!");
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1000);
        } else {
          setError(result.error || "Failed to sign in");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Sign in to save your financial wellness data"
                  : "Start tracking your financial wellness today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    mode === "signin" ? "Sign In" : "Create Account"
                  )}
                </Button>
              </form>

              <Separator className="my-4" />

              <div className="text-center text-sm">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => {
                        setMode("signup");
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Sign up
                    </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => {
                        setMode("signin");
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={onClose}
              >
                Continue without account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

