"use client";

import { useEffect, useState } from "react";
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
  Grid,
  ScrollArea,
  UnstyledButton,
  Center,
} from "@mantine/core";
import { AlertCircle, Plus, Trash2, Edit, Calendar, Clock } from "lucide-react";
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

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<
    number | null
  >(null);
  const [showPaperDetailsModal, setShowPaperDetailsModal] = useState(false);

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
    setSelectedQuestionIndex(updatedQuestions.length - 1);
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
    if (selectedQuestionIndex === index) {
      setSelectedQuestionIndex(
        updatedQuestions.length > 0 ? updatedQuestions.length - 1 : null,
      );
    }
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

  const selectedQuestion =
    selectedQuestionIndex !== null
      ? formData.questions[selectedQuestionIndex]
      : null;

  return (
    <div style={{ padding: "40px 32px", width: "100%", minHeight: "100vh" }}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title order={1} className="mb-2">
              Create Question Paper
            </Title>
            <Text c="dimmed" size="lg">
              Design and create a new question paper for your students.
            </Text>
          </div>
          <Button
            variant="subtle"
            leftSection={<Edit size={16} />}
            onClick={() => setShowPaperDetailsModal(true)}
            disabled={loading}
          >
            Edit Paper Details
          </Button>
        </div>

        {/* Paper Metadata Display */}
        {formData.title && (
          <Card shadow="xs" p="md" radius="md" withBorder bg="gray.0" mb="lg">
            <Stack gap="sm">
              <div>
                <Text size="xs" c="dimmed" fw={500} mb={4}>
                  PAPER TITLE
                </Text>
                <Text fw={600} size="lg">
                  {formData.title}
                </Text>
              </div>
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed" fw={500} mb={4}>
                    START DATE & TIME
                  </Text>
                  <Text size="sm">
                    {new Date(formData.start_date).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" fw={500} mb={4}>
                    DURATION
                  </Text>
                  <Text size="sm">
                    {formData.duration_minutes
                      ? `${formData.duration_minutes} minutes`
                      : "Not set"}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" fw={500} mb={4}>
                    STATUS
                  </Text>
                  <Badge
                    color={formData.is_published ? "green" : "yellow"}
                    variant="light"
                  >
                    {formData.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </Group>
            </Stack>
          </Card>
        )}
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

      <Grid style={{ minHeight: "600px", gap: "24px" }}>
        {/* Left Sidebar */}
        <Grid.Col span={{ base: 12, sm: 12, md: 3 }} style={{ minWidth: 0 }}>
          <Card
            shadow="sm"
            p="lg"
            radius="md"
            withBorder
            style={{ height: "100%" }}
          >
            <Card.Section withBorder inheritPadding py="md">
              <Title order={4} size="h5" mb={0}>
                Questions ({formData.questions.length})
              </Title>
            </Card.Section>

            <Stack gap={0} mt="md" style={{ height: "calc(100% - 120px)" }}>
              <ScrollArea style={{ flex: 1 }} type="auto">
                <Stack gap="xs" pr="xs">
                  {formData.questions.length === 0 ? (
                    <Center py="xl">
                      <Text c="dimmed" size="sm" ta="center">
                        No questions yet. Add one to get started.
                      </Text>
                    </Center>
                  ) : (
                    formData.questions.map((question, index) => (
                      <div key={index} style={{ display: "flex", gap: "4px" }}>
                        <UnstyledButton
                          onClick={() => setSelectedQuestionIndex(index)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            backgroundColor:
                              selectedQuestionIndex === index
                                ? "var(--mantine-color-blue-1)"
                                : "transparent",
                            border:
                              selectedQuestionIndex === index
                                ? "1px solid var(--mantine-color-blue-3)"
                                : "1px solid var(--mantine-color-gray-2)",
                            transition: "all 200ms ease",
                            textAlign: "left",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <Group gap="xs" mb={0}>
                              <Badge size="sm" variant="dot">
                                Q{index + 1}
                              </Badge>
                              <Text
                                size="xs"
                                fw={500}
                                lineClamp={2}
                                style={{ wordBreak: "break-word" }}
                              >
                                {question.question_text || "(Empty question)"}
                              </Text>
                            </Group>
                            <Badge
                              size="xs"
                              color="blue"
                              variant="light"
                              w="fit-content"
                            >
                              {question.marks_assigned} marks
                            </Badge>
                          </div>
                        </UnstyledButton>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(index);
                          }}
                          disabled={loading}
                          title="Delete question"
                          style={{
                            flexShrink: 0,
                            alignSelf: "flex-start",
                            marginTop: "4px",
                          }}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </div>
                    ))
                  )}
                </Stack>
              </ScrollArea>

              <Button
                fullWidth
                variant="light"
                size="sm"
                leftSection={<Plus size={16} />}
                onClick={() => {
                  const newQuestion: Question = {
                    question_text: "",
                    model_answer: "",
                    rubric: "",
                    marks_assigned: 1,
                    sort_order: formData.questions.length,
                  };
                  handleAddQuestion(newQuestion);
                }}
                disabled={loading}
                mt="xs"
              >
                Add Question
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right Content Area */}
        <Grid.Col span={{ base: 12, sm: 12, md: 9 }} style={{ minWidth: 0 }}>
          {selectedQuestion === null ? (
            <Card
              shadow="sm"
              p="lg"
              radius="md"
              withBorder
              style={{ minHeight: "600px" }}
            >
              <Center style={{ height: "100%" }}>
                <Stack gap="md" align="center">
                  <Text c="dimmed" size="lg" fw={500}>
                    No question selected
                  </Text>
                  <Text c="dimmed" size="sm">
                    Select a question from the sidebar or add a new one to get
                    started.
                  </Text>
                </Stack>
              </Center>
            </Card>
          ) : (
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Title order={4} mb="md">
                    Question {selectedQuestionIndex! + 1}
                  </Title>
                  <Divider />
                </div>

                <Textarea
                  label="Question Text *"
                  placeholder="Enter your question here..."
                  value={selectedQuestion.question_text}
                  onChange={(e) =>
                    handleUpdateQuestion(selectedQuestionIndex!, {
                      ...selectedQuestion,
                      question_text: e.currentTarget.value,
                    })
                  }
                  minRows={4}
                  disabled={loading}
                />

                <NumberInput
                  label="Marks Assigned *"
                  placeholder="e.g., 10"
                  min={0.5}
                  step={0.5}
                  value={selectedQuestion.marks_assigned}
                  onChange={(val) =>
                    handleUpdateQuestion(selectedQuestionIndex!, {
                      ...selectedQuestion,
                      marks_assigned: val as number,
                    })
                  }
                  disabled={loading}
                />

                <Textarea
                  label="Model Answer (Optional)"
                  placeholder="Provide a model or reference answer..."
                  value={selectedQuestion.model_answer || ""}
                  onChange={(e) =>
                    handleUpdateQuestion(selectedQuestionIndex!, {
                      ...selectedQuestion,
                      model_answer: e.currentTarget.value,
                    })
                  }
                  minRows={4}
                  disabled={loading}
                />

                <Textarea
                  label="Rubric / Grading Criteria (Optional)"
                  placeholder="Provide grading rubric or criteria..."
                  value={selectedQuestion.rubric || ""}
                  onChange={(e) =>
                    handleUpdateQuestion(selectedQuestionIndex!, {
                      ...selectedQuestion,
                      rubric: e.currentTarget.value,
                    })
                  }
                  minRows={4}
                  disabled={loading}
                />
              </Stack>
            </Card>
          )}
        </Grid.Col>
      </Grid>

      {/* Paper Details Modal */}
      <PaperDetailsModal
        opened={showPaperDetailsModal}
        onClose={() => setShowPaperDetailsModal(false)}
        formData={formData}
        setFormData={setFormData}
        totalMarks={totalMarks}
        disabled={loading}
      />

      {/* Action Buttons */}
      <Group justify="flex-end" mt="xl">
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
    </div>
  );
}

function PaperDetailsModal({
  opened,
  onClose,
  formData,
  setFormData,
  totalMarks,
  disabled,
}: {
  opened: boolean;
  onClose: () => void;
  formData: PaperFormData;
  setFormData: (data: PaperFormData) => void;
  totalMarks: number;
  disabled: boolean;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Paper Details"
      size="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Paper Title *"
          placeholder="e.g., Mathematics Final Exam 2024"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.currentTarget.value })
          }
          disabled={disabled}
        />

        <TextInput
          label="Start Date & Time *"
          type="datetime-local"
          leftSection={<Calendar size={16} />}
          value={formData.start_date}
          onChange={(e) =>
            setFormData({ ...formData, start_date: e.currentTarget.value })
          }
          disabled={disabled}
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
          disabled={disabled}
        />

        <Switch
          label="Publish Paper (visible to students)"
          checked={formData.is_published}
          onChange={(e) =>
            setFormData({
              ...formData,
              is_published: e.currentTarget.checked,
            })
          }
          disabled={disabled}
        />

        <Card p="md" radius="md" bg="blue.0" withBorder>
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Total Marks
            </Text>
            <Badge size="lg" variant="dot">
              {totalMarks}
            </Badge>
          </Group>
        </Card>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={disabled}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
