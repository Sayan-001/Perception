"use client";

import {
  TextInput,
  PasswordInput,
  Select,
  Checkbox,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock, User, IdCard } from "lucide-react";

export function SignupForm() {
  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      terms: false,
    },

    validate: {
      fullName: (value) =>
        value.length < 2 ? "Name must have at least 2 letters" : null,
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must include at least 6 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords did not match" : null,
      role: (value) => (value ? null : "Please select a role"),
      terms: (value) =>
        value ? null : "Please accept the terms and conditions",
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    console.log(values);
    // TODO: implement signup logic
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Full Name"
        placeholder="Jane Doe"
        required
        leftSection={<User size={16} />}
        {...form.getInputProps("fullName")}
      />

      <TextInput
        label="Email"
        placeholder="you@perception.edu"
        required
        mt="md"
        leftSection={<AtSign size={16} />}
        {...form.getInputProps("email")}
      />

      <Select
        label="Role"
        placeholder="Select your role"
        required
        mt="md"
        leftSection={<IdCard size={16} />}
        data={[
          { value: "student", label: "Student" },
          { value: "teacher", label: "Teacher" },
        ]}
        {...form.getInputProps("role")}
      />

      <PasswordInput
        label="Password"
        placeholder="Create an secure password"
        required
        mt="md"
        leftSection={<Lock size={16} />}
        {...form.getInputProps("password")}
      />

      <PasswordInput
        label="Confirm Password"
        placeholder="Repeat your password"
        required
        mt="md"
        leftSection={<Lock size={16} />}
        {...form.getInputProps("confirmPassword")}
      />

      <Checkbox
        label="I agree to the terms and conditions"
        mt="xl"
        {...form.getInputProps("terms", { type: "checkbox" })}
      />

      <Button fullWidth mt="xl" type="submit" color="teal">
        Create Account
      </Button>
    </form>
  );
}
