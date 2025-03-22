import { useEffect, useState } from "react";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  User,
  BarChart4,
  Flame,
  Target,
  CheckSquare,
  Sparkles,
} from "lucide-react";

interface Scores {
  clarity: number;
  relevance: number;
  accuracy: number;
  completeness: number;
  average: number;
}

interface Answer {
  order: number;
  answer: string;
  scores: Scores;
  feedback: string;
}

interface Submission {
  student_email: string;
  answers: Answer[];
  total_score: number;
}

interface Question {
  order: number;
  question: string;
  answer: string;
}

interface TeacherViewProps {
  paper: {
    _id: string;
    title: string;
    teacher_email: string;
    evaluated: boolean;
    expired: boolean;
    questions: Question[];
    submissions: Submission[];
  };
}

interface ViewProps {
  id: string;
  email: string;
}

export function TeacherView({ id, email }: ViewProps) {
  const [paper, SetPaper] = useState<TeacherViewProps["paper"]>({
    _id: "",
    title: "",
    teacher_email: "",
    evaluated: false,
    expired: false,
    questions: [],
    submissions: [],
  });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number | null>(null);

  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    let mounted = true;

    const fetchPaper = async () => {
      try {
        const response = await api.get(`/paper/view/${id}`, {
          params: { viewer_email: email, viewer_type: "teacher" },
        });
        if (mounted) {
          SetPaper(response.data.paper);

          if (response.data.paper.submissions.length > 0) {
            setSelectedStudent(
              response.data.paper.submissions[0].student_email
            );
          }
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.detail || "An error occurred";
        toast.error(errorMessage);
        router.push("/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPaper();

    return () => {
      mounted = false;
    };
  }, [id, email, router]);

  const scoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-emerald-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) return <Loading />;

  const selectedSubmission = paper.submissions.find(
    (sub) => sub.student_email === selectedStudent
  );

  const hasSubmissions = paper.submissions.length > 0;

  return (
    <div className="space-y-6">
      {/* Paper Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
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
                    <X className="h-3 w-3" /> Closed
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
                    <RefreshCw className="h-3 w-3" /> Pending Evaluation
                  </>
                )}
              </Badge>
              <span className="text-sm text-gray-500">
                {paper.submissions.length}{" "}
                {paper.submissions.length === 1 ? "submission" : "submissions"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Questions Panel */}
        <Card className="col-span-12 lg:col-span-4 shadow-sm border">
          <CardHeader className="border-b bg-gray-50/80">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Questions ({paper.questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              defaultValue={activeTab?.toString() || "0"}
              onValueChange={(v) => setActiveTab(Number(v))}
            >
              <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto">
                {paper.questions.map((q, index) => (
                  <TabsTrigger
                    key={q.order}
                    value={index.toString()}
                    className="data-[state=active]:bg-gray-100 rounded-none border-b-2 data-[state=active]:border-primary"
                  >
                    Q{q.order}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="py-4 px-6">
                {paper.questions.map((q, index) => (
                  <TabsContent
                    key={q.order}
                    value={index.toString()}
                    className="m-0"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Question {q.order}
                          </Badge>
                          <p className="text-lg font-medium text-gray-800">
                            {q.question}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Expected Answer
                          </h4>
                          <p className="text-sm bg-gray-50 p-3 rounded border">
                            {q.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submissions Panel */}
        <Card className="col-span-12 lg:col-span-8 shadow-sm border">
          <CardHeader className="border-b bg-gray-50/80">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Student Submissions
              </CardTitle>
              {hasSubmissions ? (
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                >
                  <SelectTrigger className="max-w-[250px]">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {paper.submissions.map((sub) => (
                      <SelectItem
                        key={sub.student_email}
                        value={sub.student_email}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                            {getInitials(sub.student_email)}
                          </div>
                          <span>{sub.student_email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {hasSubmissions ? (
              selectedSubmission ? (
                <div className="p-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {getInitials(selectedSubmission.student_email)}
                          </div>
                          <h3 className="font-medium">
                            {selectedSubmission.student_email}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart4 className="h-5 w-5 text-gray-400" />
                        <span className="font-bold">
                          Score: {selectedSubmission.total_score} /{" "}
                          {paper.questions.length * 10}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={
                        (selectedSubmission.total_score /
                          (paper.questions.length * 10)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-6">
                    {selectedSubmission.answers.map((ans) => (
                      <motion.div
                        key={ans.order}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden">
                          <CardHeader className="py-3 px-4 bg-gray-50/70 border-b">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">
                                Question {ans.order}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${scoreColor(
                                  ans.scores.average
                                )} text-white`}
                              >
                                {ans.scores.average.toFixed(1)}/10
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-3 rounded border text-sm">
                                {ans.answer || (
                                  <span className="text-gray-400 italic">
                                    No answer provided
                                  </span>
                                )}
                              </div>

                              <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                                    <BarChart4 className="h-4 w-4" /> Score
                                    Breakdown
                                  </h4>
                                  <div className="space-y-2.5">
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-blue-500" />{" "}
                                          Clarity
                                        </span>
                                        <span>{ans.scores.clarity}/10</span>
                                      </div>
                                      <Progress
                                        value={ans.scores.clarity * 10}
                                        className="h-1.5"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="flex items-center gap-1">
                                          <Target className="h-3 w-3 text-purple-500" />{" "}
                                          Relevance
                                        </span>
                                        <span>{ans.scores.relevance}/10</span>
                                      </div>
                                      <Progress
                                        value={ans.scores.relevance * 10}
                                        className="h-1.5"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="flex items-center gap-1">
                                          <CheckSquare className="h-3 w-3 text-green-500" />{" "}
                                          Accuracy
                                        </span>
                                        <span>{ans.scores.accuracy}/10</span>
                                      </div>
                                      <Progress
                                        value={ans.scores.accuracy * 10}
                                        className="h-1.5"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="flex items-center gap-1">
                                          <Flame className="h-3 w-3 text-amber-500" />{" "}
                                          Completeness
                                        </span>
                                        <span>
                                          {ans.scores.completeness}/10
                                        </span>
                                      </div>
                                      <Progress
                                        value={ans.scores.completeness * 10}
                                        className="h-1.5"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                                    <FileText className="h-4 w-4" /> Feedback
                                  </h4>
                                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border min-h-[80px]">
                                    {ans.feedback || "No feedback provided"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <User className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    No student selected
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Please select a student from the dropdown above to view
                    their submission
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText className="h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  No submissions yet
                </h3>
                <p className="text-gray-500 max-w-md">
                  This assessment hasn't received any student submissions yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
