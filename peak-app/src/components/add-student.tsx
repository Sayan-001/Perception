"use client";

import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { toast } from "sonner";

interface AddStudentProps {
  onAdd?: (teacherEmail: string, studentEmail: string) => Promise<void>;
}

export function AddStudent() {
  const [studentEmail, setStudentEmail] = useState("");
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setTeacherEmail(user.email);
        setError(null);
      } else {
        setTeacherEmail(null);
        setError("No authenticated user found");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail) {
      setError("Teacher email not available");
      return;
    }

    if (teacherEmail === studentEmail) {
      setError("Teacher and student email cannot be same");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post("/add-tsa", {
        teacher_email: teacherEmail,
        student_email: studentEmail,
      });

      if (response.data) {
        toast.success("Student added successfully");
        setStudentEmail("");
      }
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 400:
            setError("Student already added");
            break;
          case 404:
            setError("Student not found");
            break;
          case 500:
            setError("Internal server error occurred");
            break;
          default:
            setError("Failed to add student");
        }
      } else {
        setError("Network error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default">
          Add Student
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Student Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={isLoading || !teacherEmail}>
            {isLoading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
