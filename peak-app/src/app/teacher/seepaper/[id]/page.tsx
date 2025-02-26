"use client";
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { auth, db } from "@/firebase";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6m8p8evFYxIU60ZQpjjaVOO4rVe8hyVI",
  authDomain: "doubleslash-1.firebaseapp.com",
  projectId: "doubleslash-1",
  storageBucket: "doubleslash-1.appspot.com",
  messagingSenderId: "478224830594",
  appId: "1:478224830594:web:4fda3ea234ed4f08bf249b",
  measurementId: "G-8LFVR9FB7R"
};

// Initialize Firebase

export default function StudentAnswersPage() {
  const { id: qset_id } = useParams(); // Get qset_id from URL params
  const [submissions, setSubmissions] = useState([]); // Stores student submissions
  const [loading, setLoading] = useState(true); // Loading state
  const [title, setTitle] = useState(""); // Stores the title of the question set

  // Fetch all submissions and evaluations for the given qset_id
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Fetch the title of the question set
        const qsetDocRef = doc(db, "question_sets", qset_id);
        const qsetDocSnap = await getDoc(qsetDocRef);
        if (qsetDocSnap.exists()) {
          setTitle(qsetDocSnap.data().title);
        } else {
          setTitle("Unknown Question Set");
        }

        // Query the answer_sets collection for submissions with the given qset_id
        const q = query(collection(db, "answer_sets"), where("qset_id", "==", qset_id));
        const querySnapshot = await getDocs(q);
        const submissionData = [];

        // Fetch all evaluations for the given qset_id
        const evalQuery = query(collection(db, "evaluation"), where("qset_id", "==", qset_id));
        const evalSnapshot = await getDocs(evalQuery);

        // Create a map of evaluations by student_id for quick lookup
        const evaluationsMap = new Map();
        evalSnapshot.forEach((doc) => {
          const evaluation = doc.data();
          evaluationsMap.set(evaluation.student_id, evaluation);
        });

        // Fetch additional data (student name and scores) for each submission
        for (const submissionDoc of querySnapshot.docs) {
          const submission = { id: submissionDoc.id, ...submissionDoc.data() };

          // Fetch student name from the students collection
          const studentDocRef = doc(db, "students", submission.student_id);
          const studentDocSnap = await getDoc(studentDocRef);
          if (studentDocSnap.exists()) {
            submission.student_name = studentDocSnap.data().name;
          } else {
            submission.student_name = "Unknown Student";
          }

          // Fetch scores and feedback from the evaluations map
          const evaluation = evaluationsMap.get(submission.student_id);
          if (evaluation) {
            submission.scores = evaluation.scores || {};

            // Calculate the average score for the student
            let totalScoreSum = 0;
            let totalQuestions = 0;

            Object.values(submission.scores).forEach((questionScore) => {
              if (questionScore.scores[0] && questionScore.scores[0].score) {
                const { accuracy, clarity, completeness, relevance } = questionScore.scores[0].score;
                const questionAverage = (accuracy + clarity + completeness + relevance) / 4;
                totalScoreSum += questionAverage;
                totalQuestions++;
              }
            });

            submission.total_score = totalQuestions > 0 ? (totalScoreSum / totalQuestions).toFixed(2) : "Not evaluated";
            submission.feedback = evaluation.feedback || "No feedback available";
          } else {
            submission.scores = {};
            submission.total_score = "Not evaluated";
            submission.feedback = "No feedback available";
          }

          submissionData.push(submission);
        }

        setSubmissions(submissionData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching submissions: ", error);
        setLoading(false);
      }
    };

    if (qset_id) {
      fetchSubmissions();
    }
  }, [qset_id]);

  if (loading) {
    return <div className="text-center mt-8">Loading submissions...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20 font-geist">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Submissions for Question Set: {title}</h1>
      {submissions.length === 0 ? (
        <p className="text-gray-600">No submissions found for this question set.</p>
      ) : (
        <div className="w-full max-w-2xl">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Student Name: {submission.student_name}</h2>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-700">Answers:</h3>
                {Object.entries(submission.answers).map(([questionId, answer]) => (
                  <div key={questionId} className="mt-2">
                    <p className="text-gray-600"><strong>Question {+questionId + 1}:</strong> {answer}</p>
                    {submission.scores[questionId] && submission.scores[questionId].scores && (
                      <div className="ml-4 text-sm text-gray-500">
                        <p><strong>Accuracy:</strong> {submission.scores[questionId].scores[0].score.accuracy}</p>
                        <p><strong>Clarity:</strong> {submission.scores[questionId].scores[0].score.clarity}</p>
                        <p><strong>Completeness:</strong> {submission.scores[questionId].scores[0].score.completeness}</p>
                        <p><strong>Relevance:</strong> {submission.scores[questionId].scores[0].score.relevance}</p>
                        <p><strong>Feedback:</strong> {submission.scores[questionId].scores[0].feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-700">Evaluation:</h3>
                <p className="text-gray-600"><strong>Total Score (Average):</strong> {submission.total_score}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}