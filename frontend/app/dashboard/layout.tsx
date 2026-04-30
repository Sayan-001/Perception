"use client";

import { useState, useEffect } from "react";
import { Users, FileText, ClipboardList, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const topLinks = [
  { label: "Papers", icon: FileText, href: "/dashboard/papers" },
  { label: "Submissions", icon: ClipboardList, href: "/dashboard/submissions" },
  { label: "Associations", icon: Users, href: "/dashboard/associations" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      router.push("/login");
    }
    setMounted(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <nav className="w-64 border-r border-gray-200 bg-white p-4 flex flex-col h-screen overflow-hidden">
        <div className="space-y-1 overflow-y-auto flex-1">
          {topLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t border-gray-200 pt-4 space-y-1">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
