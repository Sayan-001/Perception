"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QPCard } from "./qp-card";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { api } from "@/axios";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  LogOut,
  User,
  Search,
  BookOpen,
  FileText,
  CheckSquare,
  Clock,
  RefreshCw,
  PencilLine,
  ChevronRight,
  List,
  Grid,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Trophy,
  GraduationCap,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Paper {
  _id: string;
  title: string;
  expired: boolean;
  evaluated: boolean;
  attempted: boolean;
  user_type: "student";
}

interface StudentViewProps {
  email: string;
}

export function StudentDashboard({ email }: StudentViewProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get initials from email
  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "active") return !paper.expired && matchesSearch;
    if (selectedTab === "attempted") return paper.attempted && matchesSearch;
    if (selectedTab === "evaluated") return paper.evaluated && matchesSearch;
    if (selectedTab === "expired") return paper.expired && matchesSearch;

    return matchesSearch;
  });

  // Derived state for statistics
  const activePapers = papers.filter((paper) => !paper.expired);
  const attemptedPapers = papers.filter((paper) => paper.attempted);
  const evaluatedPapers = papers.filter((paper) => paper.evaluated);
  const pendingPapers = papers.filter(
    (paper) => !paper.expired && !paper.attempted
  );

  const fetchPapers = async () => {
    try {
      const response = await api.get("/paper/list", {
        params: { email: email, user_type: "student" },
      });
      setPapers(response.data.papers);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchPapers();
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 h-10 w-10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden md:block">
                Student Dashboard
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

          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingPapers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Attempted</p>
                <p className="text-2xl font-bold">{attemptedPapers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Evaluated</p>
                <p className="text-2xl font-bold">{evaluatedPapers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-blue-600" />
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
              No assessments available
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              No assessments have been assigned to you yet. Check back later or
              contact your teacher.
            </p>
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
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="attempted">Attempted</TabsTrigger>
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
                        user_type="student"
                        attempted={paper.attempted}
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
                        onClick={() => {
                          if (paper.attempted) {
                            router.push(`/view-paper/${paper._id}`);
                          } else if (!paper.expired) {
                            router.push(`/attempt-paper/${paper._id}`);
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          {paper.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={
                                paper.expired ? "destructive" : "outline"
                              }
                              className={
                                paper.expired
                                  ? ""
                                  : "bg-green-50 text-green-600"
                              }
                            >
                              {paper.expired ? "Expired" : "Active"}
                            </Badge>

                            {paper.attempted && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                              >
                                Attempted
                              </Badge>
                            )}

                            {paper.evaluated && paper.attempted && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700"
                              >
                                Evaluated
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {!paper.expired && !paper.attempted ? (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 bg-primary hover:bg-primary/90"
                            >
                              <PencilLine className="mr-1 h-4 w-4" />
                              Attempt
                            </Button>
                          ) : paper.attempted ? (
                            <Button variant="outline" size="sm" className="h-8">
                              View Results
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled
                            >
                              Expired
                            </Button>
                          )}
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
