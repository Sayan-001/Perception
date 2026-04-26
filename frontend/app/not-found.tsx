"use client";

import { Container, Title, Text, Button, Group } from "@mantine/core";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container size="md" py={120}>
      <div style={{ textAlign: "center", position: "relative" }}>
        <Title
          style={{
            fontWeight: 900,
            fontSize: 220,
            lineHeight: 1,
            marginBottom: "var(--mantine-spacing-xl)",
            color: "var(--mantine-color-gray-2)",
            position: "absolute",
            top: 0,
            right: 0,
            left: 0,
            zIndex: -1,
          }}
        >
          404
        </Title>
        <div style={{ paddingTop: 120 }}>
          <Title order={1} fw={900} fz={38} mb="sm">
            You have found a secret place.
          </Title>
          <Text c="dimmed" size="lg" maw={540} mx="auto" mb="xl">
            Unfortunately, this is only a 404 page. You may have mistyped the
            address, or the page has been moved to another URL.
          </Text>
          <Group justify="center">
            <Button component={Link} href="/" size="md" variant="subtle">
              Take me back to home page
            </Button>
          </Group>
        </div>
      </div>
    </Container>
  );
}
