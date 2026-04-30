"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Text,
  Badge,
  Group,
  Card,
  Loader,
  Center,
  Alert,
  Divider,
  Stack,
  Button,
} from "@mantine/core";
import {
  AlertCircle,
  Clock,
  Calendar,
  ChevronLeft,
  FileText,
  CheckCircle,
} from "lucide-react";
import axiosClient from "@/lib/axiosClient";

interface Question {
  qid: number;
  question_text: string;
  marks_assigned: number;
  sort_order: number;
}

interface PaperData {
  title: string;
  start_date: string;
  duration_minutes: number | null;
  total_marks: number;
  is_published: boolean;
  questions: Question[];
}

const decodeTokenRole = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
};

export default function PreviewPaperPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [paper, setPaper] = useState<PaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const role = decodeTokenRole(token);
    if (role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    const fetchPaper = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/papers/${id}`);
        setPaper({
          ...res.data,
          questions:
            res.data.questions?.sort(
              (a: any, b: any) => a.sort_order - b.sort_order,
            ) || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load paper details");
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [id]);

  if (loading) {
    return (
      <Container size="md" py={60}>
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !paper) {
    return (
      <Container size="md" py={60}>
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
          {error || "Paper not found."}
        </Alert>
        <Button
          mt="md"
          variant="light"
          leftSection={<ChevronLeft size={16} />}
          onClick={() => router.push("/dashboard/papers")}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container size="md" py={40} className="min-h-screen">
      <Button
        variant="subtle"
        color="gray"
        leftSection={<ChevronLeft size={16} />}
        onClick={() => router.push("/dashboard/papers")}
        mb="md"
      >
        Back
      </Button>

      {/* Header Section */}
      <Card shadow="sm" p="xl" radius="md" withBorder mb="xl">
        <Group justify="space-between" align="flex-start" mb="md">
          <div style={{ flex: 1 }}>
            <Title order={1} mb="xs" style={{ wordBreak: "break-word" }}>
              {paper.title}
            </Title>
            <Group gap="xs" mt="xs">
              <Badge
                color={paper.is_published ? "green" : "yellow"}
                variant="light"
              >
                {paper.is_published ? "Published" : "Draft"}
              </Badge>
              <Badge color="blue" variant="light">
                Total Marks: {paper.total_marks}
              </Badge>
            </Group>
          </div>
          <FileText size={40} className="text-gray-200" />
        </Group>

        <Divider my="sm" />

        <Group grow>
          <div>
            <Group gap={8} mb={4}>
              <Calendar size={16} className="text-gray-500" />
              <Text size="sm" c="dimmed" fw={500}>
                Start Date & Time
              </Text>
            </Group>
            <Text size="sm">{new Date(paper.start_date).toLocaleString()}</Text>
          </div>
          <div>
            <Group gap={8} mb={4}>
              <Clock size={16} className="text-gray-500" />
              <Text size="sm" c="dimmed" fw={500}>
                Duration
              </Text>
            </Group>
            <Text size="sm">
              {paper.duration_minutes
                ? `${paper.duration_minutes} Minutes`
                : "Unlimited"}
            </Text>
          </div>
        </Group>
      </Card>

      {/* Instructions / Info */}
      <Card shadow="none" bg="blue.0" p="md" radius="md" mb="xl">
        <Group gap="sm" mb={4}>
          <CheckCircle size={18} className="text-blue-600" />
          <Text fw={600} c="blue.9">
            Instructions
          </Text>
        </Group>
        <Text size="sm" c="blue.8">
          This is a read-only preview of the question paper structure. Make sure
          all questions are clear and marks are assigned correctly.
        </Text>
      </Card>

      {/* Questions Section */}
      <Title order={3} mb="md">
        Questions ({paper.questions.length})
      </Title>

      {paper.questions.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed">
            No questions have been added to this paper yet.
          </Text>
        </Card>
      ) : (
        <Stack gap="lg">
          {paper.questions.map((question, index) => (
            <Card key={question.qid} shadow="xs" p="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" mb="md">
                <Badge size="lg" radius="sm">
                  Q {index + 1}
                </Badge>
                <div className="bg-gray-100 px-3 py-1 rounded text-sm font-semibold text-gray-700">
                  {question.marks_assigned}{" "}
                  {question.marks_assigned === 1 ? "Mark" : "Marks"}
                </div>
              </Group>

              <Text size="md" style={{ whiteSpace: "pre-wrap" }}>
                {question.question_text}
              </Text>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
