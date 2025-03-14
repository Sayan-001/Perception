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
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { api } from "@/axios";
import { toast } from "sonner";

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

  // Evaluate the paper (only for teachers)
  const handleEvaluateClick = async () => {
    setEvaluateLoading(true);
    try {
      await api.put(`/evaluate/${id}`);
      router.refresh();

      toast.success("Evaluation successful");
    } catch (error) {
      console.error("Evaluation failed:", error);
      toast.error("Evaluation failed");
    } finally {
      setEvaluateLoading(false);
    }
  };

  // View the paper (only for teachers and attempted papers for students)
  const handleViewClick = async () => {
    try {
      setViewLoading(true);
      await router.push(`/question-paper/${id}`);
    } catch (error) {
      console.error("Navigation failed:", error);
    } finally {
      setViewLoading(false);
    }
  };

  // Reset the evaluation (only for teachers)
  const handleResetClick = async () => {
    try {
      await api.put(`/reset/${id}`);
      router.refresh();
      toast.success("Evaluation reset");
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Reset failed");
    }
  };

  // Expire the paper (only for teachers)
  const handleExpireClick = async () => {
    try {
      await api.put(`/expire-paper/${id}`);
      router.refresh();
      toast.success("Paper set as expired!");
    } catch (error) {
      console.error("Expiry failed:", error);
      toast.error("Expiry failed!");
    }
  };

  // Unexpire the paper (only for teachers)
  const handleUnexpireClick = async () => {
    try {
      await api.put(`/unexpire-paper/${id}`);
      router.refresh();
      toast.success("Paper set as active!");
    } catch (error) {
      console.error("Unexpiry failed:", error);
      toast.error("Unexpiry failed!");
    }
  };

  return (
    <Card role="article" aria-labelledby={`paper-title-${id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={expired ? "destructive" : "secondary"}>
              {expired ? "Expired" : "Active"}
            </Badge>
            {evaluated && <Badge variant="outline">Evaluated</Badge>}
            {user_type === "student" && (
              <Badge variant={attempted ? "secondary" : "outline"}>
                {attempted ? "Attempted" : "Not Attempted"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between items-center">
        {user_type === "student" && !expired && !attempted && (
          <Button
            onClick={() => {
              router.push(`/attempt-paper/${id}`);
            }}
          >
            Attempt
          </Button>
        )}
        {user_type === "student" && attempted && (
          <Button
            onClick={() => {
              router.push(`/question-paper/${id}`);
            }}
          >
            View Attempt
          </Button>
        )}
        {user_type === "teacher" && (
          <Button onClick={handleViewClick} disabled={viewLoading}>
            {viewLoading ? "Loading..." : "View"}
          </Button>
        )}
        {user_type === "teacher" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleEvaluateClick}
                disabled={evaluateLoading || evaluated}
              >
                {evaluateLoading ? (
                  <>
                    <span className="loading loading-spinner mr-2"></span>
                    Evaluating...
                  </>
                ) : (
                  "Evaluate"
                )}
              </DropdownMenuItem>
              {!expired && (
                <DropdownMenuItem
                  onClick={handleExpireClick}
                  className="text-red-600 focus:text-red-600"
                >
                  Expire Paper
                </DropdownMenuItem>
              )}
              {expired && (
                <DropdownMenuItem
                  onClick={handleUnexpireClick}
                  className="text-green-600 focus:text-green-600"
                >
                  Unexpire Paper
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleResetClick}
                className="text-red-600 focus:text-red-600"
              >
                Reset Evaluation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
}
