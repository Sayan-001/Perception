"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/axios";
import { auth } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { UnauthorizedAccess } from "@/components/unauthorized";

interface Question {
  order: number;
  question: string;
}

interface Paper {
  title: string;
  questions: Question[];
}

interface SingleAnswer {
  order: number;
  answer: string;
}

export default function AttemptPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        setEmail(user.email);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPaper = async () => {
      if (!email) return;

      try {
        const response = await api.post("/paper/attempt-view", {
          id: params.id,
          email: email,
        });
        setPaper(response.data);
      } catch (error: any) {
        setError(error.response?.data?.detail || "Failed to load paper");
        toast.error("Failed to load paper");
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchPaper();
    }
  }, [params.id, email]);

  const handleAnswerChange = (order: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [order]: value }));
  };

  const handleSubmit = async () => {
    if (!email || !paper) return;

    setSubmitting(true);
    try {
      const formattedAnswers: SingleAnswer[] = paper.questions.map((q) => ({
        order: q.order,
        answer: answers[q.order] || "",
      }));

      await api.put("/attempted-paper", {
        paper_id: params.id,
        student_email: email,
        answer: formattedAnswers,
      });

      toast.success("Paper submitted successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to submit paper");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <UnauthorizedAccess />;
  if (!paper) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Paper Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {paper.title}
              </CardTitle>
              <Badge variant="outline">In Progress</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {paper.questions.map((question) => (
            <Card key={question.order}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {question.order}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-4">{question.question}</p>
                  <Textarea
                    placeholder="Type your answer here..."
                    className="min-h-[150px]"
                    value={answers[question.order] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.order, e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Submitting..." : "Submit Paper"}
          </Button>
        </div>
      </div>
    </div>
  );
}
