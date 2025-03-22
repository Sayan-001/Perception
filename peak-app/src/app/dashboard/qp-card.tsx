"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { api } from "@/axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  BookOpen,
  MoreVertical,
  Loader2,
  Calendar,
  CheckCircle,
  PencilLine,
  Clock,
  FileCheck,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  ArrowRight,
  Delete,
} from "lucide-react";

interface QPCardProps {
  id: string;
  title: string;
  expired: boolean;
  evaluated: boolean;
  user_type: "student" | "teacher";
  attempted?: boolean;
}

export function QPCard({
  id,
  title,
  expired,
  evaluated,
  user_type,
  attempted = false,
}: QPCardProps) {
  const router = useRouter();
  const [viewLoading, setViewLoading] = useState(false);
  const [evaluateLoading, setEvaluateLoading] = useState(false);
  const [expireLoading, setExpireLoading] = useState(false);
  const [unexpireLoading, setUnexpireLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Dialog states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExpireDialog, setShowExpireDialog] = useState(false);
  const [showUnexpireDialog, setShowUnexpireDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Evaluate the paper (only for teachers)
  const handleEvaluateClick = async () => {
    setEvaluateLoading(true);
    try {
      await api.put(`/evaluate/${id}`);
      router.refresh();
      toast.success("Evaluation successful");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Evaluation failed";
      toast.error(errorMessage);
    } finally {
      setEvaluateLoading(false);
    }
  };

  // View the paper (only for teachers and attempted papers for students)
  const handleViewClick = () => {
    setViewLoading(true);
    router.push(`/view-paper/${id}`);
    setViewLoading(false);
  };

  // Reset the evaluation (only for teachers)
  const handleResetClick = async () => {
    setResetLoading(true);
    try {
      await api.put(`/reset/${id}`);
      router.refresh();
      toast.success("Evaluation reset successfully");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Reset failed";
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
      setShowResetDialog(false);
    }
  };

  // Expire the paper (only for teachers)
  const handleExpireClick = async () => {
    setExpireLoading(true);
    try {
      await api.put(`/paper/expire/${id}`);
      router.refresh();
      toast.success("Paper set as expired!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Expire failed";
      toast.error(errorMessage);
    } finally {
      setExpireLoading(false);
      setShowExpireDialog(false);
    }
  };

  // Unexpire the paper (only for teachers)
  const handleUnexpireClick = async () => {
    setUnexpireLoading(true);
    try {
      await api.put(`/paper/unexpire/${id}`);
      router.refresh();
      toast.success("Paper set as active!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Unexpire failed";
      toast.error(errorMessage);
    } finally {
      setUnexpireLoading(false);
      setShowUnexpireDialog(false);
    }
  };

  // Delete the paper (only for teachers)
  const handleDeleteClick = async () => {
    try {
      await api.delete(`/paper/${id}`);
      router.refresh();
      toast.success("Paper deleted successfully");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Delete failed";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="overflow-hidden transition-all hover:shadow-md relative border-t-4 border-t-primary/70"
          role="article"
          aria-labelledby={`paper-title-${id}`}
        >
          {/* Top-right status indicators */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <Badge
              variant={expired ? "destructive" : "secondary"}
              className="flex items-center gap-1 transition-all"
            >
              {expired ? (
                <>
                  <XCircle className="h-3 w-3" />
                  <span>Expired</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>Active</span>
                </>
              )}
            </Badge>

            {evaluated && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 bg-green-50"
              >
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Evaluated</span>
              </Badge>
            )}

            {user_type === "student" && (
              <Badge
                variant={attempted ? "secondary" : "outline"}
                className={
                  attempted ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""
                }
              >
                {attempted ? "Attempted" : "Not Attempted"}
              </Badge>
            )}
          </div>

          <CardHeader className="pt-8">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 mt-0.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle
                  id={`paper-title-${id}`}
                  className="text-xl font-bold line-clamp-2"
                >
                  {title}
                </CardTitle>
                <CardDescription>
                  {user_type === "teacher"
                    ? "Created by you"
                    : "Assigned to you"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>{/* additional details here */}</CardContent>

          <CardFooter className="flex justify-between items-center border-t bg-gray-50/60 p-3">
            {user_type === "student" && !expired && !attempted && (
              <Button
                onClick={() => router.push(`/attempt-paper/${id}`)}
                className="flex items-center gap-2"
              >
                <PencilLine className="h-4 w-4" />
                Attempt
              </Button>
            )}
            {user_type === "student" && expired && !attempted && (
              <Button
                disabled
                className="flex items-center gap-2"
                title="Paper is expired"
              >
                Not Attempted
              </Button>
            )}
            {user_type === "student" && attempted && (
              <Button
                onClick={() => router.push(`/view-paper/${id}`)}
                className="flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                View Attempt
              </Button>
            )}
            {user_type === "teacher" && (
              <Button
                onClick={handleViewClick}
                disabled={viewLoading}
                variant="default"
                className="flex items-center gap-1.5"
              >
                {viewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4" />
                    <span>View & Manage</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
            {user_type === "teacher" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  {evaluated ? (
                    <DropdownMenuItem
                      onClick={() => setShowResetDialog(true)}
                      className="flex items-center gap-2 text-red-600 focus:text-red-700 cursor-pointer"
                      disabled={!evaluated}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Reset Evaluation</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleEvaluateClick}
                      disabled={evaluateLoading || evaluated}
                      className="flex items-center gap-2 text-emerald-600 focus:text-emerald-700 cursor-pointer"
                    >
                      {evaluateLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Evaluate Papers</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {!expired ? (
                    <DropdownMenuItem
                      onClick={() => setShowExpireDialog(true)}
                      className="flex items-center gap-2 text-amber-600 focus:text-amber-700 cursor-pointer"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Mark as Expired</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setShowUnexpireDialog(true)}
                      className="flex items-center gap-2 text-green-600 focus:text-green-700 cursor-pointer"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span>Reactivate Paper</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 text-red-500 focus:text-red-600 cursor-pointer"
                  >
                    <Delete className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all evaluation data for this paper. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetClick();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={resetLoading}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Yes, Reset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expire Confirmation Dialog */}
      <AlertDialog open={showExpireDialog} onOpenChange={setShowExpireDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Paper as Expired?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent students from attempting this paper. You can
              reactivate it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={expireLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExpireClick();
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={expireLoading}
            >
              {expireLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Expiring...
                </>
              ) : (
                "Yes, Expire"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unexpire Confirmation Dialog */}
      <AlertDialog
        open={showUnexpireDialog}
        onOpenChange={setShowUnexpireDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reopen the paper, allowing students to attempt it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unexpireLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnexpireClick();
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={unexpireLoading}
            >
              {unexpireLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reactivating...
                </>
              ) : (
                "Yes, Reactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the paper and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
