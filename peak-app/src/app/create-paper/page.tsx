"use client";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Save, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface QuestionAnswer {
  order: number;
  question: string;
  answer: string;
}

export default function CreatePaper() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionAnswer[]>([
    { order: 1, question: "", answer: "" },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (!user) {
        toast.error("Please login to create a paper");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { order: prev.length + 1, question: "", answer: "" },
    ]);
  }

  function removeQuestion(orderToRemove: number) {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.order !== orderToRemove);
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
      if (!currentUser) {
        toast.error("You must be logged in");
        return;
      }

      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }

      if (questions.some((q) => !q.question.trim() || !q.answer.trim())) {
        toast.error("Please fill all questions and answers");
        return;
      }

      const paper = {
        title: title,
        teacher_email: currentUser.email,
        questions: questions.map((q) => ({
          order: q.order,
          question: q.question,
          answer: q.answer,
        })),
        expired: false,
        evaluated: false,
        submissions: [],
      };
      console.log(paper);
      await api.post("/paper/create", paper);
      toast.success("Paper created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "An error occurred";
      toast.error(errorMessage);
    }
  }

  const handleDiscardAndReturn = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return <Loading />;
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create New Assessment
          </h1>
          <p className="text-gray-600">
            Design your questions and provide model answers
          </p>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-0 overflow-hidden mb-8">
          <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
            <div className="space-y-2">
              <Label
                htmlFor="paper-title"
                className="text-sm font-medium text-gray-700"
              >
                Assessment Title
              </Label>
              <Input
                id="paper-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                className="text-lg font-medium focus-visible:ring-primary"
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 bg-white space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-800">Questions</h2>
              <div className="text-sm text-gray-500">
                {questions.length} question(s)
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-6">
              {questions.map((q, index) => (
                <motion.div
                  key={q.order}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50 px-4 py-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {q.order}
                        </div>
                        <h3 className="font-medium text-gray-800">
                          Question {q.order}
                        </h3>
                      </div>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(q.order)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`question-${q.order}`}
                          className="text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                          Question{" "}
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </Label>
                        <Textarea
                          id={`question-${q.order}`}
                          value={q.question}
                          onChange={(e) =>
                            handleQuestionChange(
                              q.order,
                              "question",
                              e.target.value
                            )
                          }
                          placeholder="Enter your question here"
                          className="min-h-[100px] resize-none focus-visible:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`answer-${q.order}`}
                          className="text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                          Model Answer{" "}
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </Label>
                        <Textarea
                          id={`answer-${q.order}`}
                          value={q.answer}
                          onChange={(e) =>
                            handleQuestionChange(
                              q.order,
                              "answer",
                              e.target.value
                            )
                          }
                          placeholder="Enter the expected answer here"
                          className="min-h-[100px] resize-none focus-visible:ring-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between p-6 bg-gray-50 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={addQuestion}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" /> Add Question
            </Button>
          </CardFooter>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end mt-6">
          <Button
            variant="outline"
            onClick={handleDiscardAndReturn}
            className="flex items-center gap-1 border-gray-300"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            className="flex items-center gap-1 bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" /> Save Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
