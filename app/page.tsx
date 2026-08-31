import { CountdownTimer } from "@/components/CountdownTimer";

export default function Home() {
  const launchDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <main className="auth-page">
      <div style={{ maxWidth: 540, width: "100%", padding: 16 }}>
        <CountdownTimer
          targetDate={launchDate}
          title="SPUSTENIE SEZÓNY O"
          subtitle="Registrácia je otvorená. Zadaj email a získaš okamžitú notifikáciu pri štarte súťaže."
        />
      </div>
    </main>
  );
}
