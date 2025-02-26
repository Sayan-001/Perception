"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link"; // Import the Link component
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/firebase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function StudentDashboard() {
  const { id: studentId } = useParams(); // Use `studentId` from URL params
  const [teacherEmail, setTeacherEmail] = useState("");
  const [evaluatedSets, setEvaluatedSets] = useState([]);
  const [nonEvaluatedSets, setNonEvaluatedSets] = useState([]);
  const [pendingSets, setPendingSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeacherEmail, setNewTeacherEmail] = useState(""); // State for new teacher email
  const [error, setError] = useState<string | null>(null); // State for error messages

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentDocRef = doc(db, "students", studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (!studentDocSnap.exists()) {
          console.log("No student found with ID:", studentId);
          setLoading(false);
          return;
        }

        const studentData = studentDocSnap.data();
        const tEmail = studentData.teachers[0]; 
        setTeacherEmail(tEmail);

        const questionSetQuery = query(
          collection(db, "question_sets"),
          where("t_email", "==", String(tEmail))
        );
        const questionSetSnapshot = await getDocs(questionSetQuery);

        if (!questionSetSnapshot.empty) {
          const sets = questionSetSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const answerSetQuery = query(
            collection(db, "answer_sets"),
            where("student_id", "==", studentId)
          );
          const answerSetSnapshot = await getDocs(answerSetQuery);

          const submittedSetIds = answerSetSnapshot.docs.map(
            (doc) => doc.data().qset_id
          );

          const pending = sets.filter(
            (set) => !submittedSetIds.includes(set.id)
          );
          setPendingSets(pending);

          const submittedSets = sets.filter((set) =>
            submittedSetIds.includes(set.id)
          );
          const evaluated = submittedSets.filter((set) => set.evaluated);
          const nonEvaluated = submittedSets.filter((set) => !set.evaluated);

          setEvaluatedSets(evaluated);
          setNonEvaluatedSets(nonEvaluated);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [studentId, teacherEmail]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20 font-geist">
      <Button
        onClick={() => {
          signOut(auth);
          router.push("/login");
        }}
      >
        Logout
      </Button>

      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Pending Tests</h1>
        {pendingSets.length > 0 ? (
          pendingSets.map((set) => (
            <Link key={set.id} href={`/student/submitpaper/${set.id}?studentId=${encodeURIComponent(studentId)}`} passHref>
              <Card className="w-full p-4 bg-white rounded-xl shadow-md mb-4 cursor-pointer hover:bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">{set.title}</h3>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-gray-500">No pending tests.</p>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-700 mb-6">Your Submitted Sets</h1>

      <div className="w-full max-w-3xl">
        <h2 className="text-xl font-semibold text-green-600 mb-4">Evaluated</h2>
        {evaluatedSets.length > 0 ? (
          evaluatedSets.map((set) => (
            <Link key={set.id} href={`/student/seepaper/${set.id}?studentId=${encodeURIComponent(studentId)}`} passHref>
              <Card className="w-full p-4 bg-white rounded-xl shadow-md mb-4 cursor-pointer hover:bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">{set.title}</h3>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-gray-500">No evaluated sets.</p>
        )}
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Not Evaluated</h2>
        {nonEvaluatedSets.length > 0 ? (
          nonEvaluatedSets.map((set) => (
            <Link key={set.id} href={`/student/seepaper/${set.id}?studentId=${encodeURIComponent(studentId)}`} passHref>
              <Card className="w-full p-4 bg-white rounded-xl shadow-md mb-4 cursor-pointer hover:bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">{set.title}</h3>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-gray-500">No pending sets.</p>
        )}
      </div>
    </div>
  );
}
