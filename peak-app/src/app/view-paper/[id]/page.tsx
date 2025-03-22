"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { TeacherView } from "../teacher-view";
import { StudentView } from "../student-view";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { toast } from "sonner";

export default function QuestionPaperPage() {
  const params = useParams();
  const [email, setEmail] = useState<string | null>(null);
  const [type, setType] = useState<"teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user?.email) {
        setEmail(user.email);
        try {
          const response = await api.get("/type", {
            params: { email: user.email },
          });
          if (mounted) {
            setType(response.data.type);
          }
        } catch (err: any) {
          if (mounted) {
            const errorMessage =
              err.response?.data?.detail || "An error occurred";
            toast.error(errorMessage);
            router.push("/dashboard");
          }
        }
      } else {
        router.push("/login");
        toast.error("You need to login to view this page");
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="m-8">
      {type === "teacher" ? (
        <TeacherView
          id={typeof params.id === "string" ? params.id : ""}
          email={email || ""}
        />
      ) : (
        <StudentView
          id={typeof params.id === "string" ? params.id : ""}
          email={email || ""}
        />
      )}
    </div>
  );
}
