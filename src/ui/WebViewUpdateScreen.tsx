/** Shown instead of the game when the Android System WebView is too old for the layout. */
export function WebViewUpdateScreen() {
  return (
    <>
      <div className="starfield" aria-hidden="true" />
      <main
        data-testid="webview-update"
        className="relative flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <div className="glass-tile max-w-sm px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Update Android System WebView to keep playing
          </h1>
          <p className="mt-3 text-white/70">
            This game needs a newer WebView than your phone has. Open Google Play, search for
            “Android System WebView”, update it, then open the game again.
          </p>
        </div>
      </main>
    </>
  );
}
