export function App() {
  return (
    <>
      <div className="starfield" data-testid="starfield" aria-hidden="true" />
      <main
        data-testid="shell"
        className="relative flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <span className="cosmos text-6xl" aria-hidden="true">
          🌟
        </span>
        <div className="glass-tile px-8 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Cosmic Sudoku</h1>
          <p className="mt-2 text-white/70">Preparing the cosmos…</p>
        </div>
      </main>
    </>
  );
}
