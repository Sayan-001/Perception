"use client";

import {
  Container,
  SimpleGrid,
  Card,
  Text,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { Brain, FileText, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Automated Evaluations",
    description:
      "Leverage advanced AI evaluators to instantly grade and provide rich, structured feedback on complex paper submissions with high accuracy.",
  },
  {
    icon: FileText,
    title: "Seamless Submissions",
    description:
      "Effortlessly manage exams, research papers, and student submissions through an intuitive, organized, and unified interface.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "Built with solid authentication and privacy at its core, ensuring all your academic data and assessments remain strictly confidential.",
  },
];

export default function FeaturesPage() {
  const items = features.map((feature) => (
    <Card key={feature.title} shadow="sm" padding="lg" radius="md" withBorder>
      <ThemeIcon size={50} radius="xl" variant="light" color="blue" mb="md">
        <feature.icon size={28} />
      </ThemeIcon>
      <Text fw={500} fz="lg" mb="sm">
        {feature.title}
      </Text>
      <Text fz="sm" c="dimmed">
        {feature.description}
      </Text>
    </Card>
  ));

  return (
    <Container size="lg" py={120}>
      <Title order={1} ta="center" fw={900} fz={44} mb="sm">
        Powerful Features for Modern Education
      </Title>
      <Text ta="center" c="dimmed" fz="lg" maw={600} mx="auto" mb={60}>
        Perception provides comprehensive tools to streamline your evaluation
        process and enhance academic efficiency.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {items}
      </SimpleGrid>
    </Container>
  );
}
