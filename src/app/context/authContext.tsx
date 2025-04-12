"use client";

import { auth, provider } from "@/firebase";
import { User } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import { createContext, useContext, ReactNode } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

type AuthContextType = {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await auth.signOut();
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
