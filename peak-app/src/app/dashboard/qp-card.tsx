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
      <CardFooter className="flex gap-2">
        <Button onClick={handleViewClick} disabled={viewLoading}>
          {viewLoading ? "Loading..." : "View"}
        </Button>
        {user_type === "teacher" && (
          <Button variant="destructive" onClick={handleResetClick}>
            Reset Evaluation
          </Button>
        )}
        {user_type === "teacher" && (
          <Button
            variant="outline"
            onClick={handleEvaluateClick}
            disabled={evaluateLoading || evaluated}
          >
            {evaluateLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Evaluating...
              </>
            ) : (
              "Evaluate"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
