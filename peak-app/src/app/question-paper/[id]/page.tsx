"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { Loading } from "@/components/loading";
import { UnauthorizedAccess } from "@/components/unauthorized";
import { NotFound } from "@/components/not-found";
import { TeacherView } from "@/components/paper-view/teacher-view";
import { StudentView } from "@/components/paper-view/student-view";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

interface PaperData {
  type: "teacher" | "student";
  paper: any;
  attempted?: boolean;
}

export default function QuestionPaperPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setEmail(user.email);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPaperData = async () => {
      if (!email) return;

      try {
        const response = await api.post(`/paper/${params.id}`, {
          paper_id: params.id,
          viewer_email: email,
        });

        setPaperData(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setError("not-found");
        } else if (error.response?.status === 403) {
          setError("unauthorized");
        } else {
          setError("unknown");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaperData();
  }, [params.id, email]);

  if (loading) {
    return <Loading />;
  }

  if (error === "not-found") {
    return <NotFound />;
  }

  if (error === "unauthorized") {
    return <UnauthorizedAccess />;
  }

  if (!paperData) {
    return null;
  }

  return (
    <div className="m-8">
      {paperData.type === "teacher" ? (
        <TeacherView paper={paperData.paper} />
      ) : (
        <StudentView />
      )}
    </div>
  );
}
