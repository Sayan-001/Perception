"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SeePaper() {
  const { id : qid } = useParams(); // Extract question set ID from URL params
  const searchParams = useSearchParams(); // Access query parameters
    const studentId = searchParams.get("studentId");
    const [answerSet, setAnswerSet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  interface AnswerSet {
    answers: { text: string; evaluation?: string }[];
  }
  
  
  const router = useRouter();

  useEffect(() => {
    const fetchAnswerSet = async () => {
      try {


        const answerSetQuery = query(
                  collection(db, "answer_sets"),
                  where("qset_id", "==", qid),
                  where("student_id", "==", studentId)
                );

        const answerSetSnap = await getDocs(answerSetQuery);

        if (!answerSetSnap.empty) {
          setAnswerSet(answerSetSnap.docs[0].data() as AnswerSet);
        } else {
          console.log("No answer set found with ID:", qid);
        }
      } catch (error) {
        console.error("Error fetching answer set:", error);
      }
      setLoading(false);
    };

    fetchAnswerSet();
  }, [qid]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!answerSet) {
    return <div className="text-center mt-8">No answer set found.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20 font-geist">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Your Answers</h1>
      <div className="w-full max-w-3xl">
        {answerSet.answers.map((answer, index) => (
          <Card key={index} className="w-full p-4 bg-white rounded-xl shadow-md mb-4">
            <h3 className="text-lg font-medium text-gray-800">Question {index + 1}</h3>
            <p className="text-gray-600 mt-2">{answer.text}</p>
            {answer.evaluation && (
              <p className="text-green-600 font-semibold mt-2">
                Teacher's Feedback: {answer.evaluation}
              </p>
            )}
          </Card>
        ))}
      </div>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );
}
