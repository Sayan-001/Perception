import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Award,
  X,
  BookOpen,
  BarChart4,
  Flame,
  Target,
  CheckSquare,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Scores {
  clarity: number;
  relevance: number;
  accuracy: number;
  completeness: number;
  average: number;
}

interface QuestionAndAnswer {
  question: string;
  answer: string;
  scores?: Scores;
  feedback?: string;
}

interface StudentViewProps {
  title: string;
  expired: boolean;
  evaluated: boolean;
  qs_and_ans: QuestionAndAnswer[];
  total_score: number;
}

interface ViewProps {
  id: string;
  email: string;
}

export function StudentView({ id, email }: ViewProps) {
  const router = useRouter();
  const [paper, setPaper] = useState<StudentViewProps>({
    title: "",
    expired: false,
    evaluated: false,
    qs_and_ans: [],
    total_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number | null>(0);

  const calculateGrade = (
    score: number,
    total: number
  ): { letter: string; color: string; feedback: string } => {
    const percentage = (score / total) * 100;

    if (percentage >= 90)
      return {
        letter: "S",
        color: "text-green-600",
        feedback:
          "Excellent work! Your responses show exceptional understanding.",
      };
    if (percentage >= 80)
      return {
        letter: "A",
        color: "text-emerald-600",
        feedback:
          "Very good! You've demonstrated solid knowledge of the material.",
      };
    if (percentage >= 70)
      return {
        letter: "B",
        color: "text-blue-600",
        feedback:
          "Good effort. You understand the core concepts but there's room for improvement.",
      };
    if (percentage >= 60)
      return {
        letter: "C",
        color: "text-amber-600",
        feedback:
          "You've grasped some concepts, but need to work on your understanding.",
      };
    if (percentage >= 50)
      return {
        letter: "D",
        color: "text-yellow-600",
        feedback:
          "Your understanding is below average. Please review the material.",
      };
    return {
      letter: "F",
      color: "text-red-600",
      feedback:
        "Your understanding needs significant improvement. Please review the material.",
    };
  };

  const scoreColor = (score: number) => {
    if (score >= 9) return "bg-green-500";
    if (score >= 8) return "bg-emerald-500";
    if (score >= 7) return "bg-yellow-500";
    if (score >= 6) return "bg-orange-500";
    return "bg-red-500";
  };

  useEffect(() => {
    let mounted = true;

    const fetchPaper = async () => {
      try {
        const response = await api.get(`/paper/view/${id}`, {
          params: { viewer_email: email, viewer_type: "student" },
        });
        if (mounted) {
          setPaper(response.data);
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.detail || "An error occurred";
        toast.error(errorMessage);
        router.push("/dashboard");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPaper();

    return () => {
      mounted = false;
    };
  }, [id, email]);

  if (loading) return <Loading />;

  const maxPossibleScore = paper.qs_and_ans.length * 10;
  const scorePercentage = (paper.total_score / maxPossibleScore) * 100;
  const grade = calculateGrade(paper.total_score, maxPossibleScore);

  return (
    <div className="space-y-6">
      {/* Paper Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div
          className="flex items-center mb-4 text-primary hover:text-primary/90 transition-colors cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {paper.title}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <Badge
                variant={paper.expired ? "destructive" : "secondary"}
                className="flex items-center gap-1"
              >
                {paper.expired ? (
                  <>
                    <X className="h-3 w-3" /> Expired
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" /> Active
                  </>
                )}
              </Badge>
              <Badge
                variant={paper.evaluated ? "secondary" : "outline"}
                className="flex items-center gap-1"
              >
                {paper.evaluated ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Evaluated
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" /> Awaiting Evaluation
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Score Overview - Only show if evaluated */}
      {paper.evaluated ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-t-4 border-t-primary/70">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Your Assessment Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border">
                  <div className={`text-5xl font-bold ${grade.color} mb-2`}>
                    {grade.letter}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Grade</div>
                  <div className="text-xs text-center text-gray-600 max-w-[200px]">
                    {grade.feedback}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        Score
                      </div>
                      <div className="text-sm font-bold">
                        {paper.total_score} / {maxPossibleScore}
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <Progress value={scorePercentage} className="h-3" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-blue-800 text-xs font-medium mb-1">
                        QUESTIONS
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {paper.qs_and_ans.length}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="text-green-800 text-xs font-medium mb-1">
                        SCORE PERCENTAGE
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {Math.round(scorePercentage)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 py-3 px-6 border-t">
              <p className="text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                This evaluation was done using an AI system. For any concerns,
                please contact your teacher.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <Card className="bg-amber-50 border border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="mr-4 bg-amber-100 p-2 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-amber-800 mb-1">
                  Pending Evaluation
                </h3>
                <p className="text-sm text-amber-700">
                  Your submission is awaiting evaluation. Results will be
                  available once your teacher completes the review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Questions and Answers Panel */}
        <Card className="col-span-12 shadow-sm border">
          <CardHeader className="border-b bg-gray-50/80">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-500" />
              Your Answers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              defaultValue={activeTab?.toString() || "0"}
              onValueChange={(v) => setActiveTab(Number(v))}
            >
              <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto overflow-x-auto flex-nowrap">
                {paper.qs_and_ans.map((_, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className="data-[state=active]:bg-gray-100 rounded-none border-b-2 data-[state=active]:border-primary"
                  >
                    Q{index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="p-0">
                {paper.qs_and_ans.map((qa, index) => (
                  <TabsContent
                    key={index}
                    value={index.toString()}
                    className="m-0"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      <div className="space-y-6">
                        {/* Question */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="mb-2">
                              Question {index + 1}
                            </Badge>
                            {paper.evaluated && qa.scores && (
                              <Badge
                                variant="outline"
                                className={`${scoreColor(
                                  qa.scores.average
                                )} text-white ml-auto`}
                              >
                                {qa.scores.average.toFixed(1)}/10
                              </Badge>
                            )}
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <p className="text-gray-900">{qa.question}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Your Answer */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-600" /> Your
                            Answer
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg border min-h-[100px]">
                            {qa.answer ? (
                              <p className="text-gray-900">{qa.answer}</p>
                            ) : (
                              <p className="text-gray-400 italic">
                                No answer provided
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Evaluation - Only show if evaluated */}
                        {paper.evaluated && qa.scores && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="pt-4"
                          >
                            <Separator className="mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Scores */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium flex items-center gap-1.5">
                                  <BarChart4 className="h-4 w-4" /> Score
                                  Breakdown
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-blue-500" />{" "}
                                        Clarity
                                      </span>
                                      <span>{qa.scores.clarity}/10</span>
                                    </div>
                                    <Progress
                                      value={qa.scores.clarity * 10}
                                      className="h-1.5"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3 text-purple-500" />{" "}
                                        Relevance
                                      </span>
                                      <span>{qa.scores.relevance}/10</span>
                                    </div>
                                    <Progress
                                      value={qa.scores.relevance * 10}
                                      className="h-1.5"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1">
                                        <CheckSquare className="h-3 w-3 text-green-500" />{" "}
                                        Accuracy
                                      </span>
                                      <span>{qa.scores.accuracy}/10</span>
                                    </div>
                                    <Progress
                                      value={qa.scores.accuracy * 10}
                                      className="h-1.5"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1">
                                        <Flame className="h-3 w-3 text-amber-500" />{" "}
                                        Completeness
                                      </span>
                                      <span>{qa.scores.completeness}/10</span>
                                    </div>
                                    <Progress
                                      value={qa.scores.completeness * 10}
                                      className="h-1.5"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Feedback */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-1.5">
                                  <FileText className="h-4 w-4" /> Feedback
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-800 min-h-[150px]">
                                  {qa.feedback ||
                                    "No specific feedback provided for this answer."}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t bg-gray-50/80 py-4 justify-between">
            <div className="text-xs text-gray-500">
              Question {activeTab! + 1} of {paper.qs_and_ans.length}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
