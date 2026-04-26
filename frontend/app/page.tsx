"use client";

import {
  Image,
  Container,
  Title,
  Button,
  Group,
  Text,
  List,
  ThemeIcon,
  rem,
  SimpleGrid,
} from "@mantine/core";
import { Brain, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

const mockdata = [
  {
    title: "Automated Evaluations",
    description:
      "Leverage advanced AI evaluators to instantly grade and provide rich, structured feedback on complex paper submissions with high accuracy.",
    icon: Brain,
  },
  {
    title: "Seamless Submissions",
    description:
      "Effortlessly manage exams, research papers, and student submissions through an intuitive, organized, and unified interface.",
    icon: FileText,
  },
  {
    title: "Secure & Reliable",
    description:
      "Built with solid authentication and privacy at its core, ensuring all your academic data and assessments remain strictly confidential.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  const items = mockdata.map((feature) => (
    <List.Item
      key={feature.title}
      icon={
        <ThemeIcon size={24} radius="xl" color="blue">
          <feature.icon size={rem(14)} />
        </ThemeIcon>
      }
    >
      <b>{feature.title}</b> – {feature.description}
    </List.Item>
  ));

  return (
    <Container size="lg" py={{ base: 60, md: 120 }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 40, md: 60 }}>
        <div>
          <Title order={1} fw={900} fz={44} style={{ lineHeight: 1.2 }}>
            Transform Your Grading with{" "}
            <Text component="span" c="blue.6" inherit>
              Automation
            </Text>
          </Title>

          <Text c="dimmed" mt="md" size="lg">
            Perception bridges the gap between complex paper submissions and
            instantaneous intelligent feedback, allowing educators and
            professionals to evaluate at scale.
          </Text>

          <List mt={30} spacing="md" size="sm">
            {items}
          </List>

          <Group mt={40}>
            <Button size="lg" radius="xl" component={Link} href="/signup">
              Get started
            </Button>
            <Button
              size="lg"
              variant="default"
              radius="xl"
              component={Link}
              href="/login"
            >
              Login
            </Button>
          </Group>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/landing-side.png"
            alt="Perception Hero Image"
            style={{ width: "100%", maxWidth: 500, margin: "auto" }}
          />
        </div>
      </SimpleGrid>
    </Container>
  );
}
