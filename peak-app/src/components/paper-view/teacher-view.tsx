import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

export function TeacherView({ paper }: TeacherViewProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(
    paper.submissions[0]?.student_email || null
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
                <div className="font-medium">Question {q.order}</div>
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
            <CardTitle>Student Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={selectedStudent || ""}
              onValueChange={setSelectedStudent}
            >
              <TabsList className="w-full">
                {paper.submissions.map((sub) => (
                  <TabsTrigger
                    key={sub.student_email}
                    value={sub.student_email}
                    className="flex-1"
                  >
                    {sub.student_email}
                  </TabsTrigger>
                ))}
              </TabsList>

              {paper.submissions.map((sub) => (
                <TabsContent
                  key={sub.student_email}
                  value={sub.student_email}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-bold">
                      Total Score Obtained: {sub.total_score} /{" "}
                      {paper.questions.length * 10}
                    </h3>
                  </div>

                  {sub.answers.map((ans) => (
                    <Card key={ans.order}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <div className="font-bold">
                              Question {ans.order}
                            </div>
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
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
