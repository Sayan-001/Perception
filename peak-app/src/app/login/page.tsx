import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-col justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <img src="logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg" />
            <p className="text-3xl font-bold">Perception</p>
          </a>
          <p className="m-2 text-lg">
            A Platform for LLM-Based evaluation and feedback.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
        <img
          src="https://groq.com/wp-content/uploads/2024/03/PBG-mark1-color.svg"
          alt="Powered by Groq for fast inference."
          className="h-24 w-24"
        />
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login-side.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
