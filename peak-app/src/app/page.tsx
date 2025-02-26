"use client";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const fetchUserInfo = async (email: string) => {
    const teacherQuery = query(
      collection(db, "teachers"),
      where("email", "==", email)
    );
    const teacherSnap = await getDocs(teacherQuery);
    if (!teacherSnap.empty) {
      // Assuming you want the first matching teacher document.
      return { role: "teacher", id: teacherSnap.docs[0].id };
    }

    const studentQuery = query(
      collection(db, "students"),
      where("email", "==", email)
    );
    const studentSnap = await getDocs(studentQuery);
    if (!studentSnap.empty) {
      // Assuming you want the first matching student document.
      return { role: "student", id: studentSnap.docs[0].id };
    }

    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const userInfo = await fetchUserInfo(user.email);
        if (userInfo) {
          if (userInfo.role === "teacher") {
            router.push(`/teacher/dashboard/${userInfo.id}`);
          } else if (userInfo.role === "student") {
            router.push(`/student/dashboard/${userInfo.id}`);
          }
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // While redirecting, render nothing.
  return null;
}
