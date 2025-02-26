"use client";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";
import { api } from "@/lib/axios";

export default function Home() {
  const router = useRouter();

  const fetchUserInfo = async (email: string) => {
    try {
      const response = await api.get("/get-type", {
        params: {
          email: email,
        },
      });
      return response.data.type;
    } catch (error) {
      console.error("Error fetching user type:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        const type = await fetchUserInfo(user.email);

        if (type === "student") {
          router.push("/student/dashboard");
        } else if (type === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          console.error("Unknown user type:", type);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // This is a temporary solution to avoid flickering
  return <Loading />;
}
