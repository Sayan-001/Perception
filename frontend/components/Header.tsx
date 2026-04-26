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
import { useEffect, useState } from "react";

export function Header() {
  const [opened, { toggle }] = useDisclosure(false);
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasToken(localStorage.getItem("authToken") !== null);
  }, []);

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
          <Group gap="xl" className="hidden md:flex">
            <UnstyledButton
              component={Link}
              href="/features"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Features
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href="/prompt-library"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Prompt Library
            </UnstyledButton>
            <UnstyledButton
              component={Link}
              href="https://github.com/Sayan-001/Perception"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Source
            </UnstyledButton>

            {/* Dashboard or Login Buttons */}
            {mounted && (
              <Group className="hidden md:flex">
                {hasToken ? (
                  <Button variant="blue" component={Link} href="/dashboard">
                    Dashboard
                  </Button>
                ) : (
                  <Button variant="bule" component={Link} href="/login">
                    Log In
                  </Button>
                )}
              </Group>
            )}
          </Group>

          {/* Mobile Menu Toggle */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
        </div>
      </Container>
    </header>
  );
}
