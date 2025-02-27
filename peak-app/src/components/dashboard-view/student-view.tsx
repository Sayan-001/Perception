interface StudentProps {
  email: string;
}

export function StudentDashboard({ email }: StudentProps) {
  return (
    <div>
      <h1>Student Dashboard</h1>
    </div>
  );
}
