export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.06_180),oklch(0.12_0.02_250))] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.1_0.02_250))]" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
