"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loading } from "@/components/loading";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const route = user?.email ? "/dashboard" : "/login";
      router.push(route);
    });

    return () => unsubscribe();
  }, [router]);

  return <Loading />;
}
