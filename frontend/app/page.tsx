"use client";

import {
  Image,
  Container,
  Title,
  Button,
  Group,
  Text,
  SimpleGrid,
  List,
  ThemeIcon,
  rem,
} from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const benefits = [
    "Instant AI-powered grading and feedback",
    "Support for papers, exams, and submissions",
    "Detailed evaluation reports and analytics",
    "Secure and privacy-first architecture",
    "Seamless integration with your workflow",
    "Scale evaluations without manual effort",
  ];

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

          <List
            mt={30}
            spacing="md"
            size="sm"
            icon={
              <ThemeIcon size={24} radius="xl" color="blue" variant="light">
                <Check size={rem(14)} />
              </ThemeIcon>
            }
          >
            {benefits.map((benefit) => (
              <List.Item key={benefit}>{benefit}</List.Item>
            ))}
          </List>

          <Group mt={40}>
            <Button size="lg" radius="xl" component={Link} href="/signup">
              Get Started
            </Button>
            <Button
              size="lg"
              variant="default"
              radius="xl"
              component={Link}
              href="/features"
            >
              Learn More
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
