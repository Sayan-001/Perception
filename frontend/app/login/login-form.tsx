"use client";

import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Group,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must include at least 6 characters" : null,
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    console.log(values);
    // TODO: implement logic and auth
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Email"
        placeholder="mourino@perception.edu"
        required
        leftSection={<AtSign size={16} />}
        {...form.getInputProps("email")}
      />
      <PasswordInput
        label="Password"
        placeholder="Your password"
        required
        mt="md"
        leftSection={<Lock size={16} />}
        {...form.getInputProps("password")}
      />
      <Group justify="space-between" mt="lg">
        <Checkbox
          label="Remember me"
          {...form.getInputProps("remember", { type: "checkbox" })}
        />
        <Anchor component={Link} href="/forgot-password" size="sm" c="blue">
          Forgot password?
        </Anchor>
      </Group>
      <Button fullWidth mt="xl" type="submit" color="blue">
        Sign in
      </Button>
    </form>
  );
}
