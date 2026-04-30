"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Button,
  Modal,
  TextInput,
  Group,
  Stack,
  Alert,
  Loader,
} from "@mantine/core";
import { AlertCircle } from "lucide-react";
import axiosClient from "@/lib/axiosClient";

const decodeTokenRole = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
};

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<
    {
      id: string;
      email: string;
      full_name: string;
      user_type: string;
      is_verified: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  const [isTeacher, setIsTeacher] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");

  const fetchAssociations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get("/auth/associations");
      const rawData = response.data?.associations || [];
      const formatted = rawData.map(
        (
          association: {
            email: string;
            full_name: string;
            user_type: string;
            is_verified: boolean;
          },
          idx: number,
        ) => ({
          id: idx.toString(),
          email: association.email,
          full_name: association.full_name,
          user_type: association.user_type,
          is_verified: association.is_verified,
        }),
      );
      setAssociations(formatted);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsTeacher(decodeTokenRole(token) === "teacher");
    }
    fetchAssociations();
  }, [fetchAssociations]);

  const handleAddAssociation = async () => {
    if (!studentEmail.trim()) return;

    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await axiosClient.post("/auth/associations", null, {
        params: { s_email: studentEmail },
      });
      setStudentEmail("");
      setModalOpen(false);
      fetchAssociations();
    } catch (err: any) {
      setSubmitError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Title order={1} className="mb-2">
            Associations
          </Title>
          <Text c="dimmed" size="lg">
            Manage your associations and collaborations here.
          </Text>
        </div>
        {isTeacher && (
          <Button onClick={() => setModalOpen(true)}>Add Association</Button>
        )}
      </div>

      {error && (
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
          {error.message}
        </Alert>
      )}

      {associations?.length ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Verified</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {associations.map(
              (association: {
                id: string;
                email: string;
                full_name: string;
                user_type: string;
                is_verified: boolean;
              }) => (
                <Table.Tr key={association.id}>
                  <Table.Td>{association.email}</Table.Td>
                  <Table.Td>{association.full_name}</Table.Td>
                  <Table.Td className="capitalize">
                    {association.user_type}
                  </Table.Td>
                  <Table.Td>
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        association.is_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {association.is_verified ? "Yes" : "No"}
                    </span>
                  </Table.Td>
                </Table.Tr>
              ),
            )}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py={40}>
          No associations found.
        </Text>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setStudentEmail("");
        }}
        title="Add Student Association"
      >
        <Stack>
          {submitError && (
            <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
              {submitError.message}
            </Alert>
          )}
          <TextInput
            label="Student Email"
            placeholder="Enter student email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.currentTarget.value)}
            disabled={submitLoading}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setModalOpen(false);
                setStudentEmail("");
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAssociation} loading={submitLoading}>
              Add
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
