"use client";

import { Container, Title, Text } from "@mantine/core";

export default function SubmissionsPage() {
  return (
    <Container size="lg" py={40}>
      <Title order={1} className="mb-2">
        Submissions
      </Title>
      <Text c="dimmed" size="lg">
        View and manage all your submissions here.
      </Text>
    </Container>
  );
}
