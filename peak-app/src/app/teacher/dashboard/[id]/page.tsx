"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { addDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";

import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Link from "next/link";
import {
  query,
  collection,
  getDocs,
  where,
  updateDoc,
} from "firebase/firestore";

export default function TeacherPage() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState<any>(null);
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (qsId: string) => {
    try {
      const questionSetRef = doc(db, "question_sets", qsId);
      const questionSetSnap = await getDoc(questionSetRef);

      const questionSet = questionSetSnap.data().questions;

      const answersQuery = query(
        collection(db, "answer_sets"),
        where("qset_id", "==", qsId)
      );
      const answersSnap = await getDocs(answersQuery);

      const answers = answersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      for (let i = 0; i < answers.length; i++) {
        const packagedData = questionSet.map((q: any) => {
          return {
            qid: q.qid,
            question: q.question,
            teacher_answer: q.answer,
            student_answer: answers[i].answers[q.qid] || "",
          };
        });

        const response = await axios.post("http://127.0.0.1:8000/evaluate", {
          question_set: packagedData,
        });

        const evaluationData = response.data;

        addDoc(collection(db, "evaluation"), {
          qset_id: qsId,
          student_id: answers[i].student_id,
          scores: evaluationData.evaluation,
        });
      }
      await updateDoc(questionSetRef, { evaluated: true });
    } catch (err) {
      console.error("Failed to fetch answers:", err);
    }
  };

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id) return;

      try {
        const teacherRef = doc(db, "teachers", id);
        const teacherSnap = await getDoc(teacherRef);

        if (teacherSnap.exists()) {
          setTeacher(teacherSnap.data());
        } else {
          setTeacher(null);
        }
      } catch (err) {
        setError("Failed to fetch teacher data.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  useEffect(() => {
    const fetchQuestionSets = async () => {
      if (teacher) {
        try {
          const qsQuery = query(
            collection(db, "question_sets"),
            where("t_email", "==", teacher.email)
          );
          const qsSnap = await getDocs(qsQuery);

          const questionSetsData = qsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setQuestionSets(questionSetsData);
        } catch (err) {
          console.error("Failed to fetch question sets: ", err);
        }
      }
    };

    fetchQuestionSets();
  }, [teacher]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!teacher) return <p>Teacher not found.</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Name: {teacher.name}</h1>
          <h2 className="text-xl ">Email: {teacher.email}</h2>
        </div>
        <Button onClick={() => signOut(auth)}>
          <a href="/login">Logout</a>
        </Button>
      </div>
      <div className="flex justify-between items-center mt-12">
        <h2 className="text-xl">Question Sets</h2>
        <Link href={`/new_question_set`}>
          <Button>Create New Question Set</Button>
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-4 m-8">
        {questionSets.length > 0 ? (
          questionSets.map((qs) => (
            <Card key={qs.id}>
              <CardHeader>
                <CardTitle>{qs.title || "Unnamed QSet"}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {qs.description || "No description available."}
                </CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={() => handleEvaluate(qs.id)}
                  disabled={qs.evaluated ? true : false}
                >
                  Evaluate
                </Button>
                <Link href={`/teacher/seepaper/${qs.id}`}>
                  <Button>View</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p>No question sets found.</p>
        )}
      </div>
    </div>
  );
}
