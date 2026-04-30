"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextInput, PasswordInput, Select, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock, User, IdCard } from "lucide-react";
import axiosClient from "@/lib/axiosClient";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(false);
    try {
      await axiosClient.post("/auth/signup", {
        email: values.email,
        password: values.password,
        full_name: values.fullName,
        user_type: values.role,
      });
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
      router.push("/login");
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
