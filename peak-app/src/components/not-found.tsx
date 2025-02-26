import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">
          The question paper you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="w-full"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
