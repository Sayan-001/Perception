import { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Title, Text, Box } from "@mantine/core";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Perception",
  description: "Log in to your Perception account.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 w-full bg-slate-50 min-h-0">
      {/* Left Content / Form Area */}
      <div className="w-full lg:w-[480px] xl:w-[540px] flex-shrink-0 border-r border-gray-200 bg-white p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
        <Box mb={40}>
          <Title order={2} className="font-sans text-slate-800 mb-2">
            Welcome back!
          </Title>
          <Text c="dimmed" size="sm">
            Don`t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register
            </Link>
          </Text>
        </Box>

        <LoginForm />
      </div>

      {/* Right Background Image */}
      <div className="hidden lg:block relative flex-1 bg-slate-100">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/side-of-auth.jpg)",
          }}
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
