"use client";

import {
  Container,
  Group,
  Burger,
  Title,
  Button,
  UnstyledButton,
  Avatar,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { BrainCircuit, LogOut, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure(false);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authToken = localStorage.getItem("authToken");
    setToken(authToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    router.push("/");
  };

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
          </Group>

          {/* CTA Buttons / Profile */}
          {mounted && (
            <Group className="hidden md:flex">
              {token ? (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Avatar
                      src="/default-avatar.jpg"
                      alt="User Profile"
                      radius="xl"
                      style={{ cursor: "pointer" }}
                      size="md"
                    />
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<User size={14} />}
                      component={Link}
                      href="/dashboard"
                    >
                      Dashboard
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<Settings size={14} />}
                      component={Link}
                      href="/settings"
                    >
                      Settings
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<LogOut size={14} />}
                      color="red"
                      onClick={handleLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <>
                  <Button variant="default" component={Link} href="/login">
                    Log in
                  </Button>
                  <Button color="blue" component={Link} href="/signup">
                    Sign up
                  </Button>
                </>
              )}
            </Group>
          )}

          {/* Mobile Menu Toggle */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
        </div>
      </Container>
    </header>
  );
}
