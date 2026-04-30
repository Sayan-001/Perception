"use client";

import { Container, Title, Text, Button } from "@mantine/core";
import Link from "next/link";

export default function PapersPage() {
  return (
    <Container size="lg" py={40}>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Title order={1} className="mb-2">
            Papers
          </Title>
          <Text c="dimmed" size="lg">
            Manage your question papers and submissions here.
          </Text>
        </div>
        <Link href="/paper/create">
          <Button>Create Paper</Button>
        </Link>
      </div>
    </Container>
  );
}
