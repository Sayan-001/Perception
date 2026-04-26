import { Metadata } from "next";
import { SignupForm } from "./signup-form";
import { Title, Text, Box } from "@mantine/core";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up | Perception",
  description: "Create your Perception account.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 w-full bg-slate-50 min-h-0">
      {/* Left Content / Form Area */}
      <div className="w-full lg:w-120 xl:w-135 shrink-0 border-r border-gray-200 bg-white p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
        <Box mb={40}>
          <Title order={2} className="font-sans text-slate-800 mb-2">
            Join Perception
          </Title>
          <Text c="dimmed" size="sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-teal-600 hover:underline font-semibold"
            >
              Sign in
            </Link>
          </Text>
        </Box>

        <SignupForm />
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
        <div className="absolute inset-0 bg-teal-900/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
