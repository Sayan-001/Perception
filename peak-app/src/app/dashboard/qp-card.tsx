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
}

export function QPCard({
  id,
  title,
  expired,
  evaluated,
  user_type,
}: QPCardProps) {
  const router = useRouter();
  const [viewLoading, setViewLoading] = useState(false);
  const [evaluateLoading, setEvaluateLoading] = useState(false);

  const handleEvaluateClick = async () => {
    setEvaluateLoading(true);
    try {
      const response = await api.put(`/evaluate/${id}`);
      router.refresh();

      toast.success("Evaluation successful");
    } catch (error) {
      console.error("Evaluation failed:", error);
      toast.error("Evaluation failed");
    } finally {
      setEvaluateLoading(false);
    }
  };

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

  const handleExpireClick = async () => {
    try {
      await api.put(`/expire-paper/${id}`);
      window.location.reload();
      toast.success("Paper set as expired!");
    } catch (error) {
      console.error("Expiry failed:", error);
      toast.error("Expiry failed!");
    }
  };

  const handleUnexpireClick = async () => {
    try {
      await api.put(`/unexpire-paper/${id}`);
      window.location.reload();
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
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={handleViewClick} disabled={viewLoading}>
          {viewLoading ? "Loading..." : "View"}
        </Button>

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
