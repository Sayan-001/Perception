"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextInput, PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock } from "lucide-react";
import axiosClient from "@/lib/axiosClient";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 3 ? "Password must include at least 3 characters" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(false);
    try {
      const response = await axiosClient.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      localStorage.setItem("authToken", response.data?.access_token);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
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

      {error && (
        <div className="text-red-500 text-sm mt-4 text-center">
          Failed to login! Please check your credentials and try again.
        </div>
      )}

      <Button
        fullWidth
        mt="xl"
        type="submit"
        color="blue"
        loading={loading}
        disabled={loading}
      >
        Sign in
      </Button>
    </form>
  );
}
