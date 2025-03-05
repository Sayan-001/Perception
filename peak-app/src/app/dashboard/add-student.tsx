"use client";
import { useState } from "react";
import { auth } from "@/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/axios";
import { toast } from "sonner";

export function AddStudent() {
  const [studentEmail, setStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherEmail = auth.currentUser?.email;

    if (teacherEmail === studentEmail) {
      toast.error("Teacher and student email cannot be same");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/add-tsa", {
        teacher_email: teacherEmail,
        student_email: studentEmail,
      });

      toast.success("Student added successfully");
      setStudentEmail("");
    } catch (error: any) {
      const message =
        error.response?.status === 404
          ? "Student not found"
          : "Failed to add student";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Add Student</Button>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
