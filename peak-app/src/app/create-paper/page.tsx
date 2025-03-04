"use client";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/axios";
import { UnauthorizedAccess } from "@/components/unauthorized";

interface QuestionAnswer {
  order: number;
  question: string;
  answer: string;
}

export default function CreatePaper() {
  const router = useRouter();

  const [CurrentUser, setCurrentUser] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionAnswer[]>([
    { order: 1, question: "", answer: "" },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { order: prev.length + 1, question: "", answer: "" },
    ]);
  }

  function removeQuestion(orderToRemove: number) {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.order !== orderToRemove);
      // Reorder remaining questions
      return filtered.map((q, idx) => ({
        ...q,
        order: idx + 1,
      }));
    });
  }

  function handleQuestionChange(
    order: number,
    field: "question" | "answer",
    value: string
  ) {
    setQuestions((prev) =>
      prev.map((q) => (q.order === order ? { ...q, [field]: value } : q))
    );
  }

  async function handleSubmit() {
    try {
      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }

      if (questions.some((q) => !q.question.trim() || !q.answer.trim())) {
        toast.error("Please fill all questions and answers");
        return;
      }

      const payload = {
        title: title,
        teacher_email: CurrentUser.email,
        questions: questions.map((q) => ({
          order: q.order,
          question: q.question,
          answer: q.answer,
        })),
        expired: false,
        evaluated: false,
        submissions: [],
      };

      const response = await api.post("/create-paper", payload);
      toast.success("Paper created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create paper");
    }
  }

  const discardAndReturn = () => {
    router.push("/dashboard");
  };

  if (!CurrentUser) {
    return <UnauthorizedAccess />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20">
      <div className="w-full max-w-2xl">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter paper title"
          className="w-full p-3 rounded-lg border border-gray-300 mb-6"
        />

        {questions.map((q) => (
          <Card key={q.order} className="mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Question {q.order}</h3>
              {questions.length > 1 && (
                <Button
                  variant="destructive"
                  onClick={() => removeQuestion(q.order)}
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <Textarea
              value={q.question}
              onChange={(e) =>
                handleQuestionChange(q.order, "question", e.target.value)
              }
              placeholder="Enter your question"
              className="mb-4"
            />

            <Textarea
              value={q.answer}
              onChange={(e) =>
                handleQuestionChange(q.order, "answer", e.target.value)
              }
              placeholder="Enter the answer"
            />
          </Card>
        ))}

        <div className="flex gap-4 justify-end mt-6">
          <Button variant="destructive" onClick={discardAndReturn}>
            Discard and Return
          </Button>
          <Button variant="outline" onClick={addQuestion}>
            Add Question
          </Button>
          <Button onClick={handleSubmit}>Create Paper</Button>
        </div>
      </div>
    </div>
  );
}
