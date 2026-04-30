"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Group,
  Alert,
  Loader,
  Divider,
  Badge,
  ActionIcon,
  Modal,
  SimpleGrid,
} from "@mantine/core";
import {
  AlertCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { useRouter } from "next/navigation";

interface Question {
  question_text: string;
  model_answer?: string;
  rubric?: string;
  marks_assigned: number;
  sort_order: number;
}

interface PaperFormData {
  title: string;
  start_date: string;
  duration_minutes?: number;
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

export default function CreatePaperPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<PaperFormData>({
    title: "",
    start_date: new Date().toISOString().slice(0, 16),
    duration_minutes: undefined,
    is_published: false,
    questions: [],
  });

  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<
    number | null
  >(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Auth check
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

    setIsTeacher(true);
    setMounted(true);
  }, [router]);

  const totalMarks = formData.questions.reduce(
    (sum, q) => sum + (q.marks_assigned || 0),
    0,
  );

  const handleAddQuestion = (newQuestion: Question) => {
    const updatedQuestions = [
      ...formData.questions,
      {
        ...newQuestion,
        sort_order: formData.questions.length,
      },
    ];
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
    setShowAddQuestionModal(false);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = formData.questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({
        ...q,
        sort_order: i,
      }));
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
    setExpandedQuestionIndex(null);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.questions.length - 1)
    ) {
      return;
    }

    const updatedQuestions = [...formData.questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updatedQuestions[index], updatedQuestions[newIndex]] = [
      updatedQuestions[newIndex],
      updatedQuestions[index],
    ];

    updatedQuestions.forEach((q, i) => {
      q.sort_order = i;
    });

    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestion,
      sort_order: index,
    };
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleCreatePaper = async () => {
    // Validation
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError("Paper title is required");
      return;
    }

    if (!formData.start_date) {
      setSubmitError("Start date is required");
      return;
    }

    if (formData.questions.length === 0) {
      setSubmitError("At least one question is required");
      return;
    }

    // Validate all questions have text and marks
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question_text.trim()) {
        setSubmitError(`Question ${i + 1} text is required`);
        return;
      }
      if (!q.marks_assigned || q.marks_assigned <= 0) {
        setSubmitError(`Question ${i + 1} must have marks greater than 0`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        start_date: new Date(formData.start_date).toISOString(),
        duration_minutes: formData.duration_minutes || null,
        is_published: formData.is_published,
        questions: formData.questions.map((q) => ({
          question_text: q.question_text,
          model_answer: q.model_answer || null,
          rubric: q.rubric || null,
          marks_assigned: parseFloat(q.marks_assigned.toString()),
          sort_order: q.sort_order,
        })),
      };

      const response = await axiosClient.post("/papers", payload);

      setSuccessMessage(`Paper "${response.data.title}" created successfully!`);
      setTimeout(() => {
        router.push(`/dashboard/papers`);
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create paper";
      setSubmitError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isTeacher) {
    return (
      <Container size="lg" py={40}>
        <div className="flex justify-center items-center min-h-100">
          <Loader />
        </div>
      </Container>
    );
  }

  return (
    <Container size="lg" py={40}>
      <div className="mb-8">
        <Title order={1} className="mb-2">
          Create Question Paper
        </Title>
        <Text c="dimmed" size="lg">
          Design and create a new question paper for your students.
        </Text>
      </div>

      {successMessage && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Success"
          color="green"
          mb="lg"
        >
          {successMessage}
        </Alert>
      )}

      {submitError && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Error"
          color="red"
          mb="lg"
        >
          {submitError}
        </Alert>
      )}

      {/* Paper Details Card */}
      <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
        <Card.Section withBorder inheritPadding py="md">
          <Title order={3}>Paper Details</Title>
        </Card.Section>

        <Stack gap="md">
          <TextInput
            label="Paper Title"
            placeholder="e.g., Mathematics Final Exam 2024"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.currentTarget.value })
            }
            disabled={loading}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Start Date & Time"
              type="datetime-local"
              leftSection={<Calendar size={16} />}
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.currentTarget.value })
              }
              disabled={loading}
            />

            <NumberInput
              label="Duration (Minutes)"
              placeholder="e.g., 120"
              min={1}
              leftSection={<Clock size={16} />}
              value={formData.duration_minutes || ""}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  duration_minutes: val as number | undefined,
                })
              }
              disabled={loading}
            />
          </SimpleGrid>

          <Switch
            label="Publish Paper (visible to students)"
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_published: e.currentTarget.checked,
              })
            }
            disabled={loading}
          />

          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
            <Text size="sm" fw={500}>
              Total Marks
            </Text>
            <Badge size="lg" variant="dot">
              {totalMarks}
            </Badge>
          </div>
        </Stack>
      </Card>

      {/* Questions Section */}
      <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
        <Card.Section withBorder inheritPadding py="md">
          <div className="flex justify-between items-center">
            <Title order={3}>Questions ({formData.questions.length})</Title>
            <Button
              size="xs"
              leftSection={<Plus size={16} />}
              onClick={() => setShowAddQuestionModal(true)}
              disabled={loading}
            >
              Add Question
            </Button>
          </div>
        </Card.Section>

        <Stack gap="md">
          {formData.questions.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No questions added yet. Add your first question to get started.
            </Text>
          ) : (
            formData.questions.map((question, index) => (
              <Card key={index} p="md" radius="md" withBorder bg="gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Group gap="xs" mb="xs">
                      <Badge variant="dot">{index + 1}</Badge>
                      <Text fw={500} size="sm" lineClamp={1}>
                        {question.question_text || "(Empty question)"}
                      </Text>
                    </Group>
                    <Badge color="blue" variant="light">
                      {question.marks_assigned} marks
                    </Badge>
                  </div>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => handleMoveQuestion(index, "up")}
                      disabled={index === 0 || loading}
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => handleMoveQuestion(index, "down")}
                      disabled={
                        index === formData.questions.length - 1 || loading
                      }
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        setExpandedQuestionIndex(
                          expandedQuestionIndex === index ? null : index,
                        )
                      }
                      disabled={loading}
                      title="Edit"
                    >
                      ✎
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeleteQuestion(index)}
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                </div>

                {/* Expanded Question Form */}
                {expandedQuestionIndex === index && (
                  <>
                    <Divider my="md" />
                    <Stack gap="md">
                      <Textarea
                        label="Question Text"
                        placeholder="Enter your question here..."
                        value={question.question_text}
                        onChange={(e) =>
                          handleUpdateQuestion(index, {
                            ...question,
                            question_text: e.currentTarget.value,
                          })
                        }
                        minRows={3}
                        disabled={loading}
                      />

                      <NumberInput
                        label="Marks Assigned"
                        placeholder="e.g., 10"
                        min={0}
                        step={0.5}
                        value={question.marks_assigned}
                        onChange={(val) =>
                          handleUpdateQuestion(index, {
                            ...question,
                            marks_assigned: val as number,
                          })
                        }
                        disabled={loading}
                      />

                      <Textarea
                        label="Model Answer (Optional)"
                        placeholder="Provide a model or reference answer..."
                        value={question.model_answer || ""}
                        onChange={(e) =>
                          handleUpdateQuestion(index, {
                            ...question,
                            model_answer: e.currentTarget.value,
                          })
                        }
                        minRows={3}
                        disabled={loading}
                      />

                      <Textarea
                        label="Rubric / Grading Criteria (Optional)"
                        placeholder="Provide grading rubric or criteria..."
                        value={question.rubric || ""}
                        onChange={(e) =>
                          handleUpdateQuestion(index, {
                            ...question,
                            rubric: e.currentTarget.value,
                          })
                        }
                        minRows={3}
                        disabled={loading}
                      />

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setExpandedQuestionIndex(null)}
                        disabled={loading}
                      >
                        Done Editing
                      </Button>
                    </Stack>
                  </>
                )}
              </Card>
            ))
          )}
        </Stack>
      </Card>

      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={() => router.push("/dashboard/papers")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleCreatePaper} loading={loading}>
          Create Paper
        </Button>
      </Group>

      {/* Add Question Modal */}
      <Modal
        opened={showAddQuestionModal}
        onClose={() => setShowAddQuestionModal(false)}
        title="Add New Question"
        size="md"
      >
        <AddQuestionForm
          onAddQuestion={handleAddQuestion}
          onCancel={() => setShowAddQuestionModal(false)}
          disabled={loading}
        />
      </Modal>
    </Container>
  );
}

function AddQuestionForm({
  onAddQuestion,
  onCancel,
  disabled,
}: {
  onAddQuestion: (question: Question) => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [question, setQuestion] = useState<Question>({
    question_text: "",
    model_answer: "",
    rubric: "",
    marks_assigned: 1,
    sort_order: 0,
  });

  const handleSubmit = () => {
    if (!question.question_text.trim()) {
      alert("Question text is required");
      return;
    }

    if (!question.marks_assigned || question.marks_assigned <= 0) {
      alert("Marks must be greater than 0");
      return;
    }

    onAddQuestion(question);
  };

  return (
    <Stack gap="md">
      <Textarea
        label="Question Text"
        placeholder="Enter your question here..."
        value={question.question_text}
        onChange={(e) =>
          setQuestion({ ...question, question_text: e.currentTarget.value })
        }
        minRows={3}
        disabled={disabled}
      />

      <NumberInput
        label="Marks Assigned"
        placeholder="e.g., 10"
        min={0.5}
        step={0.5}
        value={question.marks_assigned}
        onChange={(val) =>
          setQuestion({ ...question, marks_assigned: val as number })
        }
        disabled={disabled}
      />

      <Textarea
        label="Model Answer (Optional)"
        placeholder="Provide a model or reference answer..."
        value={question.model_answer || ""}
        onChange={(e) =>
          setQuestion({ ...question, model_answer: e.currentTarget.value })
        }
        minRows={3}
        disabled={disabled}
      />

      <Textarea
        label="Rubric / Grading Criteria (Optional)"
        placeholder="Provide grading rubric or criteria..."
        value={question.rubric || ""}
        onChange={(e) =>
          setQuestion({ ...question, rubric: e.currentTarget.value })
        }
        minRows={3}
        disabled={disabled}
      />

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={disabled}>
          Add Question
        </Button>
      </Group>
    </Stack>
  );
}
