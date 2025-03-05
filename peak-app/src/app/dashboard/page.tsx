"use client";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/axios";
import { useRouter } from "next/navigation";
import { StudentDashboard } from "./student-view";
import { TeacherDashboard } from "./teacher-view";
import { useLoading } from "@/components/providers/loading-provider";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"teacher" | "student" | null>(null);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        router.replace("/login");
        toast.error("Please login to access the dashboard");
        return;
      }

      try {
        const { data } = await api.get("/get-type", {
          params: { email: user.email },
        });
        setUserType(data.type);
      } catch (error) {
        toast.error("Authentication failed");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [router, setIsLoading]);

  if (!userType) return null;

  return userType === "teacher" ? (
    <TeacherDashboard email={auth.currentUser?.email!} />
  ) : (
    <StudentDashboard email={auth.currentUser?.email!} />
  );
}
