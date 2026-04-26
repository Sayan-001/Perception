"use client";

import { useRouter } from "next/navigation";
import { TextInput, PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AtSign, Lock } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { authAPI } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
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

  const { data, loading, error, execute } = useApi(authAPI.logIn);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await execute(values.email, values.password);
      localStorage.setItem("authToken", data?.access_token);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
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
