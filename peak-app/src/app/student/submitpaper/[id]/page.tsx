"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { useParams, useSearchParams } from "next/navigation";

export default function SubmitPaper() {
  const { id: set_id } = useParams(); // Extract `set_id` from the URL
  const searchParams = useSearchParams(); // Access query parameters
  const studentId = searchParams.get("studentId"); // Extract `studentId`
  const [questions, setQuestions] = useState({}); // Stores fetched questions as a map
  const [answers, setAnswers] = useState({}); // Stores student's answers as a map
  const [loading, setLoading] = useState(true); // Loading state
  const [title, setTitle] = useState(""); // Stores the title of the question set

  // Fetch questions from a specific set_id
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const docRef = doc(db, "question_sets", set_id); // Reference to the specific document
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.set_name); // Set the title of the question set
          setQuestions(data.questions || {}); // Set the questions as a map
        } else {
          console.log("No such document!");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions: ", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [set_id]); // Add `set_id` to dependency array

  // Handle input change for student answers
  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answer,
    }));
  };

  // Submit student answers to Firestore
  const submitAnswers = async () => {
    try {
      await addDoc(collection(db, "answer_sets"), {
        student_id: studentId, // Student ID
        qset_id: set_id, // Question set ID
        answers, // Student's answers
      });
      alert("Answers submitted successfully!");
    } catch (error) {
      console.error("Error submitting answers: ", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading questions...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20 font-geist">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">{title}</h1>
      {Object.entries(questions).map(([qid, question], index) => (
        <Card
          key={qid}
          className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-lg mb-6"
        >
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Question {index + 1}: {question.question}
          </h3>
          <Textarea
            className="border border-gray-300 rounded-lg p-3 w-full"
            value={answers[qid] || ""}
            onChange={(e) => handleAnswerChange(qid, e.target.value)}
            placeholder="Write your answer here..."
          />
        </Card>
      ))}
      <Button
        onClick={submitAnswers}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
      >
        Submit Answers
      </Button>
    </div>
  );
}
