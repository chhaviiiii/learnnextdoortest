export const metadata = {
  title: "Admin · LearnNextDoor",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Each route under /admin supplies its own shell:
  // - /admin/login renders its own full-screen layout
  // - /admin/(protected)/* uses AdminShell
  return <>{children}</>;
}
