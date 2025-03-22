"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/axios";
import { auth } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loading } from "@/components/loading";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FileQuestion,
  Save,
  PenLine,
  AlertTriangle,
  CornerDownLeft,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
} from "lucide-react";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [savedStatus, setSavedStatus] = useState<{ [key: number]: boolean }>(
    {}
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save timer
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const unsavedQuestions = Object.entries(answers).filter(
        ([order, answer]) =>
          answer.trim().length > 0 && !savedStatus[Number(order)]
      );

      if (unsavedQuestions.length > 0 && email && paper) {
        try {
          // Format all answers for submission (both saved and unsaved)
          const formattedAnswers: SingleAnswer[] = paper.questions.map((q) => ({
            order: q.order,
            answer: answers[q.order] || "",
          }));

          const payload = {
            paper_id: params.id,
            student_email: email,
            answer: formattedAnswers,
          };

          // Call the backend API
          await api.post("/paper/attempt", payload);

          // Mark all as saved
          const newSavedStatus = { ...savedStatus };
          unsavedQuestions.forEach(([order]) => {
            newSavedStatus[Number(order)] = true;
          });
          setSavedStatus(newSavedStatus);

          toast.success("Answers auto-saved", { duration: 2000 });
        } catch (error) {
          console.error("Auto-save failed:", error);
          toast.error("Auto-save failed. Your progress might not be saved.", {
            duration: 4000,
          });
        }
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [answers, savedStatus, email, paper, params.id]);

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
        const response = await api.get(`/paper/attempt/${params.id}`, {
          params: { student_email: email },
        });
        setPaper(response.data);
      } catch (error: any) {
        router.push("/dashboard");
        toast.error("Failed to load paper");
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchPaper();
    }
  }, [params.id, email]);

  // Focus textarea when changing questions
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [currentQuestion]);

  const handleAnswerChange = (order: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [order]: value }));
    setSavedStatus((prev) => ({ ...prev, [order]: false }));
  };

  const handleSaveAnswer = async (order: number) => {
    if (!answers[order] || answers[order].trim() === "") {
      toast.info("Nothing to save");
      return;
    }

    try {
      const formattedAnswers: SingleAnswer[] = paper.questions.map((q) => ({
        order: q.order,
        answer: answers[q.order] || "",
      }));

      const payload = {
        paper_id: params.id,
        student_email: email,
        answer: formattedAnswers,
      };

      // Call the API
      await api.post("/paper/attempt", payload);

      // Mark this answer as saved
      setSavedStatus((prev) => ({ ...prev, [order]: true }));
      toast.success("Answer saved!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save answer. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!email || !paper) return;

    // Check if there are any unanswered questions
    const unansweredQuestions = paper.questions.filter(
      (q) => !answers[q.order] || answers[q.order].trim() === ""
    );

    if (unansweredQuestions.length > 0) {
      const isPlural = unansweredQuestions.length > 1;
      toast.warning(
        `You have ${unansweredQuestions.length} unanswered question(s). Please check before submitting.`
      );
      return;
    }

    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    if (!email || !paper) return;

    setSubmitting(true);
    try {
      const formattedAnswers: SingleAnswer[] = paper.questions.map((q) => ({
        order: q.order,
        answer: answers[q.order] || "",
      }));

      const payload = {
        paper_id: params.id,
        student_email: email,
        answer: formattedAnswers,
      };

      await api.post("/paper/attempt", payload);

      toast.success("Paper submitted successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Failed to submit paper");
      setShowSubmitDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (!paper) return;
    if (currentQuestion < paper.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (!paper) return 0;
    const answeredQuestions = paper.questions.filter(
      (q) => answers[q.order] && answers[q.order].trim() !== ""
    ).length;
    return (answeredQuestions / paper.questions.length) * 100;
  };

  if (loading || !paper) return <Loading />;
  const currentQ = paper.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 text-primary hover:text-primary/90 transition-colors"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {paper.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                In Progress
              </Badge>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Submit Paper
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-md border shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Your Progress
            </span>
            <span className="text-sm font-medium text-gray-700">
              {
                paper.questions.filter(
                  (q) => answers[q.order] && answers[q.order].trim() !== ""
                ).length
              }
              /{paper.questions.length} Questions Answered
            </span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Question Navigator */}
          <div className="col-span-12 md:col-span-3">
            <Card className="sticky top-28">
              <CardHeader className="py-3 px-4 bg-gray-50 border-b">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FileQuestion className="h-4 w-4 text-gray-500" />
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                  {paper.questions.map((q, index) => {
                    const isAnswered =
                      answers[q.order] && answers[q.order].trim() !== "";
                    const isActive = index === currentQuestion;

                    return (
                      <Button
                        key={q.order}
                        variant={
                          isActive
                            ? "default"
                            : isAnswered
                            ? "outline"
                            : "ghost"
                        }
                        size="sm"
                        className={`justify-start ${
                          isAnswered && !isActive
                            ? "bg-green-50 border-green-200 text-green-700"
                            : ""
                        }`}
                        onClick={() => setCurrentQuestion(index)}
                      >
                        {isAnswered ? (
                          <BookmarkCheck className="h-3.5 w-3.5 mr-2" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5 mr-2" />
                        )}
                        Q{q.order}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50/80 p-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSubmit}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Submit All
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Current Question */}
          <div className="col-span-12 md:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex justify-between">
                      <Badge variant="outline" className="mb-1 bg-white">
                        Question {currentQ.order} of {paper.questions.length}
                      </Badge>
                      {savedStatus[currentQ.order] && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Saved
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">
                      {currentQ.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="answer"
                          className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                        >
                          <PenLine className="h-4 w-4 text-gray-500" />
                          Your Answer
                        </label>
                        <div className="text-xs text-gray-500">
                          Press Ctrl+Enter to save
                        </div>
                      </div>
                      <Textarea
                        id="answer"
                        ref={textareaRef}
                        placeholder="Type your answer here..."
                        className="min-h-[250px] resize-y"
                        value={answers[currentQ.order] || ""}
                        onChange={(e) =>
                          handleAnswerChange(currentQ.order, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.ctrlKey && e.key === "Enter") {
                            handleSaveAnswer(currentQ.order);
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 p-4 flex flex-wrap justify-between gap-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestion === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextQuestion}
                        disabled={
                          currentQuestion === paper.questions.length - 1
                        }
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSaveAnswer(currentQ.order)}
                        disabled={
                          !answers[currentQ.order] ||
                          savedStatus[currentQ.order]
                        }
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        Save Answer
                      </Button>
                      {currentQuestion === paper.questions.length - 1 && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleSubmit}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Submit Paper
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Tips Card */}
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex">
                <HelpCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">Tips</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      Your answers are automatically saved, but you can also
                      manually save each answer
                    </li>
                    <li>
                      Navigate between questions using the sidebar or
                      previous/next buttons
                    </li>
                    <li>Review all questions before submitting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Your Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your answers. This action cannot be
              undone.
              {paper.questions.some(
                (q) => !answers[q.order] || answers[q.order].trim() === ""
              ) && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    You have unanswered questions. Are you sure you want to
                    proceed?
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSubmit();
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Yes, Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
