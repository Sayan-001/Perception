"use client";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [mains, setMains] = useState([
    { id: 0, isEditable: true, question: "", answer: "" },
  ]);
  const [CurrentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  function addq() {
    setMains((prevMains) =>
      prevMains
        .map((main, i) =>
          i === prevMains.length - 1 ? { ...main, isEditable: false } : main
        )
        .concat({
          id: prevMains.length,
          isEditable: true,
          question: "",
          answer: "",
        })
    );
  }

  function toggleEdit(index: number) {
    setMains((prevMains) =>
      prevMains.map((main, i) =>
        i === index ? { ...main, isEditable: !main.isEditable } : main
      )
    );
  }

  function deleteq(index: number) {
    setMains((prevMains) => prevMains.filter((_, i) => i !== index));
  }

  async function submitAllToFirestore() {
    try {
      const submissionData = mains.map((main) => ({
        qid: main.id,
        question: main.question,
        answer: main.answer,
      }));

      await addDoc(collection(db, "question_sets"), {
        evaluated: false,
        t_email: CurrentUser.email,
        title: title,
        questions: submissionData,
      });
      alert("All data saved successfully!");
    } catch (error) {
      console.error("Error adding documents: ", error);
    }
  }

  function handleInputChange(index: number, field: string, value: string) {
    setMains((prevMains) =>
      prevMains.map((main, i) =>
        i === index ? { ...main, [field]: value } : main
      )
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 pb-20 gap-6 sm:p-20 font-geist">
      <div className="w-full max-w-2xl mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the title of the question set"
          className="border border-gray-300 rounded-lg p-3 w-full"
        />
      </div>

      {mains.map((main, index) => (
        <Card
          key={main.id}
          className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Question {index + 1}
          </h2>
          <Textarea
            className="border border-gray-300 rounded-lg p-3 w-full"
            disabled={!main.isEditable}
            value={main.question}
            onChange={(e) =>
              handleInputChange(index, "question", e.target.value)
            }
            placeholder="Enter your question here..."
          />
          <Textarea
            className="border border-gray-300 rounded-lg p-3 w-full mt-4"
            disabled={!main.isEditable}
            value={main.answer}
            onChange={(e) => handleInputChange(index, "answer", e.target.value)}
            placeholder="Enter your answer here..."
          />
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => toggleEdit(index)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {main.isEditable ? "Done" : "Edit"}
            </Button>
            <Button
              onClick={() => deleteq(index)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={addq}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Add new question
        </Button>
        <Button
          onClick={submitAllToFirestore}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Submit All
        </Button>
      </div>
    </div>
  );
}
