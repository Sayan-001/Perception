"use client";

import { useRouter } from "next/navigation";
import { TextInput, PasswordInput, Select, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock, User, IdCard } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { authAPI } from "@/lib/api";

export function SignupForm() {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      role: "",
    },

    validate: {
      fullName: (value) =>
        value.length < 2 ? "Name must have at least 2 letters" : null,
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 3 ? "Password must include at least 3 characters" : null,
      role: (value) => (value ? null : "Please select a role"),
    },
  });

  const { data, loading, error, execute } = useApi(authAPI.signup);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await execute(
        values.email,
        values.password,
        values.fullName,
        values.role,
      );
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
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

      {error && (
        <div className="text-red-500 text-sm mt-4 text-center">
          Failed to create account! Please check your information and try again.
        </div>
      )}

      <Button
        fullWidth
        mt="xl"
        type="submit"
        color="teal"
        disabled={loading}
        loading={loading}
      >
        Create Account
      </Button>
    </form>
  );
}
