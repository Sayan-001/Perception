"use client";
import { useEffect, useState, useCallback } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/axios";
import { Loading } from "@/components/loading";
import { UnauthorizedAccess } from "@/components/unauthorized";
import { useRouter } from "next/navigation";

import { TeacherDashboard } from "@/components/dashboard-view/teacher-view";
import { StudentDashboard } from "@/components/dashboard-view/student-view";

interface UserType {
  type: "teacher" | "student";
}

interface ApiResponse {
  type: UserType["type"];
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType["type"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(
    async (email: string): Promise<UserType["type"]> => {
      try {
        const response = await api.get<ApiResponse>("/get-type", {
          params: { email },
        });

        return response.data.type;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch user type"
        );
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user?.email) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setEmail(user.email);
          const type = await fetchUserInfo(user.email);
          setUserType(type);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error ? error.message : "Authentication error"
          );
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      controller.abort();
    };
  }, [router, fetchUserInfo]);

  if (error || !email) {
    return <UnauthorizedAccess />;
  }

  if (loading) {
    return <Loading />;
  }

  return userType === "teacher" ? (
    <TeacherDashboard email={email} />
  ) : (
    <StudentDashboard email={email} />
  );
}
