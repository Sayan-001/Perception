"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { UnauthorizedAccess } from "@/components/unauthorized";
import { TeacherView } from "../teacher-view";
import { StudentView } from "../student-view";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

export default function QuestionPaperPage() {
  const params = useParams();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [type, setType] = useState<"teacher" | "student">("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user?.email) {
        setEmail(user.email);
        try {
          const response = await api.get("/get-type", {
            params: { email: user.email },
          });
          if (mounted) {
            setType(response.data.type);
          }
        } catch (error: any) {
          if (mounted) {
            setError(error);
          }
        }
      } else {
        setEmail("unauthorized");
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (!email || loading) {
    return <Loading />;
  } else if (email === "unauthorized") {
    return <UnauthorizedAccess />;
  }

  return (
    <div className="m-8">
      {type === "teacher" ? (
        <TeacherView id={params.id} email={email} />
      ) : (
        <StudentView id={params.id} email={email} />
      )}
    </div>
  );
}
