import { NazotokiGame } from "@/components/nazotoki-game";

export default function Page() {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <NazotokiGame />
      </div>
    </main>
  );
}
