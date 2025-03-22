"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QPCard } from "./qp-card";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { api } from "@/axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Plus,
  LogOut,
  User,
  Search,
  BookOpen,
  FileText,
  CheckSquare,
  Clock,
  Delete,
  RefreshCw,
  ChevronRight,
  List,
  Grid,
} from "lucide-react";

import { toast } from "sonner";

interface Paper {
  _id: string;
  title: string;
  expired: boolean;
  evaluated: boolean;
  user_type: "teacher";
}

interface TeacherViewProps {
  email: string;
}

export function TeacherDashboard({ email }: TeacherViewProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Array<string>>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [addStudentQuery, setAddStudentQuery] = useState<string>("");

  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  const ongoingPapers = papers.filter((paper) => !paper.expired);
  const expiredPapers = papers.filter((paper) => paper.expired);
  const evaluatedPapers = papers.filter((paper) => paper.evaluated);

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "ongoing") return !paper.expired && matchesSearch;
    if (selectedTab === "expired") return paper.expired && matchesSearch;
    if (selectedTab === "evaluated") return paper.evaluated && matchesSearch;

    return matchesSearch;
  });

  const fetchPapers = async () => {
    try {
      const response = await api.get("/paper/list", {
        params: { email: email, user_type: "teacher" },
      });
      setPapers(response.data.papers);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to fetch papers";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStudents = async () => {
    try {
      const response = await api.get("/studentlist", {
        params: { email },
      });
      setStudents(response.data.students);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to fetch students";
      toast.error(errorMessage);
    }
  };

  const handleRemoveStudent = async (studentEmail: string) => {
    try {
      await api.delete("/tsa", {
        data: { teacher_email: email, student_email: studentEmail },
      });
      toast.success("Student removed successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to remove student";
      toast.error(errorMessage);
    } finally {
      getStudents();
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.post("/tsa", {
        teacher_email: email,
        student_email: addStudentQuery,
      });
      toast.success("Student added successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to add student";
      toast.error(errorMessage);
    } finally {
      getStudents();
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchPapers();
  };

  useEffect(() => {
    fetchPapers();
    getStudents();
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 h-10 w-10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden md:block">
                Teacher Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative rounded-md max-w-xs hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Search papers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 focus-visible:ring-primary"
                />
              </div>
              <Button
                onClick={refreshData}
                variant="ghost"
                size="icon"
                className={`${refreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCreatePaper}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9"
                  >
                    <Avatar className="h-9 w-9 bg-primary/10 hover:bg-primary/20 transition-colors">
                      <AvatarFallback className="text-sm text-primary">
                        {getInitials(email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">My Account</p>
                      <p className="text-xs text-gray-500 truncate">{email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Sheet>
                    <SheetTrigger asChild onClick={getStudents}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <User className="h-4 w-4 mr-2" />
                        <span>Manage Students</span>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </DropdownMenuItem>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[400px] sm:w-[540px]"
                    >
                      <SheetHeader>
                        <SheetTitle>Student Management</SheetTitle>
                        <SheetDescription>
                          View and manage students in your class
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Search students..."
                              className="pl-9"
                              onChange={(e) =>
                                setAddStudentQuery(e.target.value)
                              }
                            />
                          </div>
                          <Button variant="default" onClick={handleAddStudent}>
                            {" "}
                            Add Student
                          </Button>
                        </div>

                        {/* Students List */}
                        <Card>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead className="w-[100px] text-right">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {students.length > 0 ? (
                                  students.map(
                                    (email: string, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                                            {getInitials(email)}
                                          </div>
                                          <div>
                                            <p className="text-sm">{email}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleRemoveStudent(email)
                                            }
                                          >
                                            <Delete className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={2}>
                                      <div className="text-center py-6 text-sm text-gray-500">
                                        <p>No students found</p>
                                        <p className="text-xs mt-1">
                                          Add students to get started
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                      <SheetFooter className="mt-4">
                        <div className="text-xs text-gray-500">
                          Students can view and attempt your assessments
                        </div>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
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
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Papers
                </p>
                <p className="text-2xl font-bold">{papers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Active Count */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Active Papers
                </p>
                <p className="text-2xl font-bold">{ongoingPapers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Evaluated Count */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Evaluated</p>
                <p className="text-2xl font-bold">{evaluatedPapers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Students Count */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <User className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        ) : papers.length === 0 ? (
          <Card className="border-dashed border-2 p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No assessments created yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first assessment to start evaluating your students'
              understanding.
            </p>
            <Button
              onClick={handleCreatePaper}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Assessment
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Tabs
                defaultValue="all"
                className="w-full sm:w-auto"
                value={selectedTab}
                onValueChange={setSelectedTab}
              >
                <TabsList>
                  <TabsTrigger value="all">All Papers</TabsTrigger>
                  <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                  <TabsTrigger value="evaluated">Evaluated</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="relative w-full sm:w-auto md:hidden">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search papers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-full"
                  />
                </div>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-none h-9 w-9"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {filteredPapers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <div className="h-12 w-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  No matching assessments
                </h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredPapers.map((paper) => (
                    <motion.div
                      key={paper._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <QPCard
                        id={paper._id}
                        title={paper.title}
                        expired={paper.expired}
                        evaluated={paper.evaluated}
                        user_type="teacher"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPapers.map((paper) => (
                      <TableRow
                        key={paper._id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/view-paper/${paper._id}`)}
                      >
                        <TableCell className="font-medium">
                          {paper.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                paper.expired ? "destructive" : "outline"
                              }
                            >
                              {paper.expired ? "Expired" : "Active"}
                            </Badge>
                            {paper.evaluated && (
                              <Badge variant="secondary">Evaluated</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8">
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
