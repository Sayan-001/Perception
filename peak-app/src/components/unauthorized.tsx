import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnauthorizedAccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-6">Sorry, the page is not accessible.</p>
        <div className="space-y-4">
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
