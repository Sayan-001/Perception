"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QPCard } from "./qp-card";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { api } from "@/axios";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Plus, LogOut, User } from "lucide-react";
import { AddStudent } from "./add-student";

interface Paper {
  _id: string;
  title: string;
  expired: boolean;
  evaluated: boolean;
  user_type: "teacher";
}

interface TeacherProps {
  email: string;
}

export function TeacherDashboard({ email }: TeacherProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await api.get("/all-papers", {
          params: { email },
        });
        setPapers(response.data.papers);
      } catch (error) {
        console.error("Failed to fetch papers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [email]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCreatePaper = () => {
    router.push("/create-paper");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src="logo.jpg" alt="Logo" className="h-12 w-12 rounded-lg" />
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <AddStudent />
              <Button
                onClick={handleCreatePaper}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Paper
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid place-items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No question papers
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new question paper.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreatePaper}>
                <Plus className="h-4 w-4 mr-2" />
                Create Paper
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <QPCard
                key={paper._id}
                id={paper._id}
                title={paper.title}
                expired={paper.expired}
                evaluated={paper.evaluated}
                user_type="teacher"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
