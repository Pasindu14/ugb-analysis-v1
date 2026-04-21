import { LoginForm } from "@/features/auth/components/forms/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-primary p-16 overflow-hidden">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Logo mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="size-6 border border-primary-foreground/25 flex items-center justify-center">
            <div className="size-1.5 bg-primary-foreground/70" />
          </div>
          <span className="text-primary-foreground/50 text-xs tracking-[0.3em] uppercase font-light">
            UGB Analysis
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-primary-foreground text-[3.5rem] font-light leading-[1.1] tracking-tight">
            Sales<br />
            Analysis<br />
            Platform
          </h1>
          <div className="h-px w-10 bg-primary-foreground/25" />
          <p className="text-primary-foreground/40 text-sm leading-relaxed max-w-xs">
            Unified sales intelligence for growing organizations.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-primary-foreground/20 text-[11px] tracking-widest uppercase">
            © 2026 UGB Analysis
          </p>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex items-center justify-center p-8 bg-background border-l border-border">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
