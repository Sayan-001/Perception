"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Group,
  Badge,
  SimpleGrid,
  ActionIcon,
  Loader,
  Center,
  Menu,
  Alert,
} from "@mantine/core";
import {
  AlertCircle,
  MoreVertical,
  Edit,
  Trash,
  Eye,
  Clock,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import axiosClient from "@/lib/axiosClient";

interface QuestionPaper {
  qpid: number;
  title: string;
  start_date: string;
  duration_minutes?: number;
  total_marks: number;
  is_published: boolean;
  created_at: string;
}

const decodeTokenRole = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
};

export default function PapersPage() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/papers");
      setPapers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setRole(decodeTokenRole(token));
    }
    fetchPapers();
  }, []);

  const handleDelete = async (qpid: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this paper? This action cannot be undone.",
      )
    )
      return;

    try {
      await axiosClient.delete(`/papers/${qpid}`);
      setPapers(papers.filter((p) => p.qpid !== qpid));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete paper");
    }
  };

  return (
    <Container size="xl" py={40}>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Title order={1} className="mb-2">
            Papers
          </Title>
          <Text c="dimmed" size="lg">
            {role === "teacher"
              ? "Manage your question papers and submissions here."
              : "View available question papers and submit your answers here."}
          </Text>
        </div>
        {role === "teacher" && (
          <Link href="/paper/create">
            <Button leftSection={<Plus size={16} />}>Create Paper</Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Error"
          color="red"
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Center py={60}>
          <Loader />
        </Center>
      ) : papers.length === 0 ? (
        <Card withBorder p="xl" radius="md" ta="center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <Title order={3} mb="sm" c="dimmed">
            No papers created yet
          </Title>
          <Text c="dimmed" mb="md">
            You haven't created any question papers. Get started by creating
            your first one.
          </Text>
          <Link href="/paper/create">
            <Button variant="light" leftSection={<Plus size={16} />}>
              Create Paper
            </Button>
          </Link>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {papers.map((paper) => (
            <Card
              key={paper.qpid}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Badge
                    color={paper.is_published ? "green" : "yellow"}
                    variant="light"
                  >
                    {paper.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Menu withinPortal position="bottom-end" shadow="sm">
                    {role === "teacher" && (
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <MoreVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                    )}

                    <Menu.Dropdown>
                      <Menu.Item
                        component={Link}
                        href={`/paper/${paper.qpid}/edit`}
                        leftSection={<Edit size={14} />}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        component={Link}
                        href={`/paper/${paper.qpid}/preview`}
                        leftSection={<Eye size={14} />}
                      >
                        Preview
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash size={14} />}
                        onClick={() => handleDelete(paper.qpid)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Card.Section>

              <div className="mt-4 mb-4">
                <Title order={4} lineClamp={2} mb="xs">
                  {paper.title}
                </Title>

                <Group gap="xs" mb={8}>
                  <Calendar size={14} className="text-gray-500" />
                  <Text size="sm" c="dimmed">
                    Starts: {new Date(paper.start_date).toLocaleDateString()}{" "}
                    {new Date(paper.start_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Group>

                <Group gap="xs" mb={8}>
                  <Clock size={14} className="text-gray-500" />
                  <Text size="sm" c="dimmed">
                    Duration:{" "}
                    {paper.duration_minutes
                      ? `${paper.duration_minutes} mins`
                      : "Unlimited"}
                  </Text>
                </Group>
              </div>

              <Card.Section withBorder inheritPadding py="sm" mt="auto">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Total Marks: {paper.total_marks}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Created {new Date(paper.created_at).toLocaleDateString()}
                  </Text>
                </Group>
              </Card.Section>
              {role === "student" && paper.is_published && (
                <Button
                  fullWidth
                  variant="light"
                  color="blue"
                  mt="md"
                  component={Link}
                  href={`/paper/submit/${paper.qpid}`}
                >
                  Submit Paper
                </Button>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
