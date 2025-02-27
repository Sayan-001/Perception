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
  type: "teacher" | "student" | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(
    async (email: string): Promise<UserType["type"]> => {
      try {
        const response = await api.get("/get-type", {
          params: { email },
        });

        if (!response.data.type) {
          throw new Error("Invalid user type received");
        }

        return response.data.type as UserType["type"];
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch user type";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user?.email) {
          if (isMounted) {
            setLoading(false);
            router.push("/login");
          }
          return;
        }

        if (isMounted) {
          setEmail(user.email);
          const type = await fetchUserInfo(user.email);

          if (!type && isMounted) {
            throw new Error("Invalid user type");
          }

          if (isMounted) {
            setIsTeacher(type === "teacher");
            setLoading(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error ? error.message : "Authentication error"
          );
          router.push("/login");
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, fetchUserInfo]);

  if (error) {
    return <UnauthorizedAccess />;
  }

  if (loading) {
    return <Loading />;
  }

  if (!email) {
    return <UnauthorizedAccess />;
  }

  return isTeacher ? (
    <TeacherDashboard email={email} />
  ) : (
    <StudentDashboard email={email} />
  );
}
