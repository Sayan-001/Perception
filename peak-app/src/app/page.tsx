"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLoading } from "@/components/providers/loading-provider";

export default function Home() {
  const router = useRouter();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const route = user?.email ? "/dashboard" : "/login";
      setIsLoading(false);
      router.push(route);
    });

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [router, setIsLoading]);

  return null;
}
