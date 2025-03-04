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
import { LogOut, User } from "lucide-react";

interface Paper {
  _id: string;
  title: string;
  expired: boolean;
  evaluated: boolean;
  attempted: boolean;
  user_type: "student";
}

interface StudentProps {
  email: string;
}

export function StudentDashboard({ email }: StudentProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPapers = async () => {
    try {
      const response = await api.get("/student-papers", {
        params: { email },
      });
      setPapers(response.data.papers);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src="logo.jpg" alt="Logo" className="h-12 w-12 rounded-lg" />
            <h1 className="text-2xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <div className="flex items-center gap-4">
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
              No papers available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't been assigned any papers yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Papers Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Active Papers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers
                  .filter((paper) => !paper.expired)
                  .map((paper) => (
                    <QPCard
                      key={paper._id}
                      id={paper._id}
                      title={paper.title}
                      expired={paper.expired}
                      evaluated={paper.evaluated}
                      attempted={paper.attempted}
                      user_type="student"
                    />
                  ))}
              </div>
              {papers.filter((paper) => !paper.expired).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No active papers available
                </p>
              )}
            </section>

            {/* Expired Papers Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Past Papers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers
                  .filter((paper) => paper.expired)
                  .map((paper) => (
                    <QPCard
                      key={paper._id}
                      id={paper._id}
                      title={paper.title}
                      expired={paper.expired}
                      evaluated={paper.evaluated}
                      attempted={paper.attempted}
                      user_type="student"
                    />
                  ))}
              </div>
              {papers.filter((paper) => paper.expired).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No past papers available
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
