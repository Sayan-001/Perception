import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/axios";
import { Loading } from "@/components/loading";
import { UnauthorizedAccess } from "@/components/unauthorized";

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
  // 1. Group all useState hooks at the top
  const [paper, SetPaper] = useState<TeacherViewProps["paper"]>({
    _id: "",
    title: "",
    teacher_email: "",
    evaluated: false,
    expired: false,
    questions: [],
    submissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const fetchPaper = async () => {
      try {
        const response = await api.post("/paper/teacher-view", {
          id: id,
          email: email,
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
        setError(error);
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

  if (loading) {
    return <Loading />;
  } else if (error) {
    return <UnauthorizedAccess />;
  }

  const selectedSubmission = paper.submissions.find(
    (sub) => sub.student_email === selectedStudent
  );

  return (
    <div className="space-y-8">
      {/* Paper Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant={paper.expired ? "destructive" : "secondary"}>
              {paper.expired ? "Expired" : "Active"}
            </Badge>
            <Badge variant={paper.evaluated ? "secondary" : "outline"}>
              {paper.evaluated ? "Evaluated" : "Pending Evaluation"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Questions Panel */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paper.questions.map((q) => (
              <div
                key={q.order}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="font-medium underline">Question {q.order}</div>
                <p className="mt-2 text-gray-800 font-bold">{q.question}</p>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Expected Answer:</span>{" "}
                  {q.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submissions Panel */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Submissions</CardTitle>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {paper.submissions.map((sub) => (
                    <SelectItem
                      key={sub.student_email}
                      value={sub.student_email}
                    >
                      {sub.student_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSubmission ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-bold">
                    Total Score Obtained: {selectedSubmission.total_score} /{" "}
                    {paper.questions.length * 10}
                  </h3>
                </div>

                {selectedSubmission.answers.map((ans) => (
                  <Card key={ans.order}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <div className="font-bold">Question {ans.order}</div>
                          <p className="mt-2">Answer: {ans.answer || ""}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 underline">
                              Scores
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Clarity:</span>
                                <span>{ans.scores.clarity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Relevance:</span>
                                <span>{ans.scores.relevance}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Accuracy:</span>
                                <span>{ans.scores.accuracy}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completeness:</span>
                                <span>{ans.scores.completeness}</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Average:</span>
                                <span>{ans.scores.average}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 underline">
                              Feedback
                            </h4>
                            <p className="text-sm text-gray-600">
                              {ans.feedback || "No feedback provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No student selected
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
