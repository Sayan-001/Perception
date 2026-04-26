"use client";

import {
  Container,
  Group,
  Burger,
  Title,
  Button,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <header className="h-15 border-b border-gray-200 bg-white sticky top-0 z-50">
      <Container size="xl" className="h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo Section */}
          <Link href="/" className="no-underline">
            <Group gap="sm" className="cursor-pointer">
              <BrainCircuit size={28} className="text-blue-600" />
              <Title
                order={3}
                className="text-slate-800 font-sans tracking-tight"
              >
                Perception
              </Title>
            </Group>
          </Link>

          {/* Desktop Navigation */}
          <Group gap="lg" className="hidden md:flex">
            <UnstyledButton
              component={Link}
              href="/features"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Features
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href="/pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href="/about"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              About
            </UnstyledButton>
          </Group>

          {/* CTA Buttons */}
          <Group className="hidden md:flex">
            <Button variant="default" component={Link} href="/login">
              Log in
            </Button>
            <Button color="blue" component={Link} href="/signup">
              Sign up
            </Button>
          </Group>

          {/* Mobile Menu Toggle */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
        </div>
      </Container>
    </header>
  );
}
