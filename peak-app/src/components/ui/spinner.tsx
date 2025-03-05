export function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen w-full fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div
        className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
