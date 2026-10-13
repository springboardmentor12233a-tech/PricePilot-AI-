import { useAuth } from "../context/AuthContext";
import { ChartCard } from "../components/Common";

export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-semibold">Settings</h1>
      <ChartCard title="Account">
        <div className="text-sm space-y-1">
          <p><span className="text-slate-400">Name:</span> {user?.full_name}</p>
          <p><span className="text-slate-400">Email:</span> {user?.email}</p>
          <p><span className="text-slate-400">Role:</span> {user?.role}</p>
        </div>
      </ChartCard>
      <ChartCard title="About PricePilot AI">
        <p className="text-sm text-slate-400">
          Dynamic Pricing Optimization & Revenue Intelligence System. All figures shown throughout the app are
          computed from your local PostgreSQL database, seeded from the four provided datasets — nothing is
          simulated or hard-coded.
        </p>
      </ChartCard>
    </div>
  );
}
