"use client";

import { Container, Group, Text } from "@mantine/core";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-slate-50 py-8">
      <Container size="xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Group gap="sm" className="opacity-80">
            <BrainCircuit size={24} className="text-blue-600" />
            <Text size="lg" fw={700} className="text-slate-700">
              Perception
            </Text>
          </Group>

          <Text c="dimmed" size="sm">
            © {new Date().getFullYear()} Perception Educational Systems. All
            rights reserved.
          </Text>

          <Group gap="md">
            <Link
              href="#"
              className="text-slate-500 hover:text-slate-800 text-sm"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-slate-500 hover:text-slate-800 text-sm"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-slate-500 hover:text-slate-800 text-sm"
            >
              Support
            </Link>
          </Group>
        </div>
      </Container>
    </footer>
  );
}
