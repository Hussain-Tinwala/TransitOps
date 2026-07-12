import Sidebar from "@/components/Sidebar";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* We add a subtle inner shadow to separate the sidebar visually */}
        <div className="min-h-full p-8 shadow-inner">
          {children}
        </div>
      </main>
    </div>
  );
}