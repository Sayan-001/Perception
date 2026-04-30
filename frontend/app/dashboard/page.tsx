"use client";

import { Container, Title, Text, SimpleGrid, Card, ThemeIcon } from "@mantine/core";
import { BarChart3, TrendingUp, FileCheck } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Papers",
      value: "24",
      icon: FileCheck,
      color: "blue",
    },
    {
      title: "Evaluations Done",
      value: "18",
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Pending Review",
      value: "6",
      icon: BarChart3,
      color: "orange",
    },
  ];

  return (
    <Container size="lg" py={40}>
      <div className="mb-12">
        <Title order={1} className="mb-2">
          Welcome back!
        </Title>
        <Text c="dimmed" size="lg">
          Here's an overview of your recent activity.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {stats.map((stat) => (
          <Card key={stat.title} shadow="sm" p="lg" radius="md" withBorder>
            <div className="flex items-start justify-between">
              <div>
                <Text fw={500} size="sm" c="dimmed" className="mb-1">
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
              <ThemeIcon
                variant="light"
                size="xl"
                radius="md"
                color={stat.color}
              >
                <stat.icon size={24} />
              </ThemeIcon>
            </div>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
