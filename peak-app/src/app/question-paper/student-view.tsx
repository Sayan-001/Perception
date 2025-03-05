import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [paper, setPaper] = useState<StudentViewProps>({
    title: "",
    expired: false,
    evaluated: false,
    qs_and_ans: [],
    total_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPaper = async () => {
      try {
        const response = await api.post("/paper/student-view", {
          id: id,
          email: email,
        });
        if (mounted) {
          setPaper(response.data);
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

  if (loading) return <Loading />;
  if (error) return <UnauthorizedAccess />;

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

      {/* Score Card - Only show if evaluated */}
      {paper.evaluated && (
        <Card>
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {paper.total_score} / {paper.qs_and_ans.length * 10}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions and Answers */}
      <div className="space-y-6">
        {paper.qs_and_ans.map((qa, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Question</h3>
                <p className="text-gray-900">{qa.question}</p>
              </div>

              {/* Your Answer */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Your Answer
                </h3>
                <p className="text-gray-900">
                  {qa.answer || "No answer provided"}
                </p>
              </div>

              {/* Evaluation - Only show if evaluated */}
              {paper.evaluated && qa.scores && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  {/* Scores */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Scores
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Clarity:</span>
                        <span>{qa.scores.clarity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relevance:</span>
                        <span>{qa.scores.relevance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span>{qa.scores.accuracy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completeness:</span>
                        <span>{qa.scores.completeness}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Average:</span>
                        <span>{qa.scores.average}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Feedback
                    </h3>
                    <p className="text-sm text-gray-600">
                      {qa.feedback || "No feedback provided"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
