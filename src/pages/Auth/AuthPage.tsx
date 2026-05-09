import { Outlet } from "react-router";
import { Anchor, ShieldCheck, Globe, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Regulatory Compliance",
    desc: "Automated compliance tracking across all vessels and crew.",
  },
  {
    icon: Globe,
    title: "Fleet-Wide Visibility",
    desc: "Real-time operational status for your entire maritime fleet.",
  },
  {
    icon: BarChart3,
    title: "Actionable Analytics",
    desc: "Data-driven insights to optimize safety and performance.",
  },
];

function AuthPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div
        className="hidden xl:flex xl:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.09 0.03 248) 0%, oklch(0.18 0.06 235) 50%, oklch(0.25 0.08 215) 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 195), transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-8"
          style={{
            background:
              "radial-gradient(circle, oklch(0.42 0.15 220), transparent 70%)",
            transform: "translate(-40%, 40%)",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-teal shadow-lg">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Maritime Ops</p>
            <p className="text-xs text-white/40">Fleet Compliance Platform</p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Command your fleet
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.7 0.15 195), oklch(0.8 0.14 180))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                with confidence.
              </span>
            </h1>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-sm">
              The maritime compliance management platform designed for modern
              fleet operations — from maintenance to safety drills.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-[oklch(0.7_0.15_195)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-4 py-3 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-white/60">
              Trusted by maritime operators worldwide
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ─────────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center p-6"
        style={{ background: "oklch(0.97 0.008 220)" }}
      >
        {/* Small logo for mobile */}
        <div className="absolute top-6 left-6 flex items-center gap-2 xl:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-teal">
            <Anchor className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">Maritime Ops</span>
        </div>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
