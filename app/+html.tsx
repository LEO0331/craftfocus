import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>CraftFocus</title>
        <meta
          name="description"
          content="CraftFocus helps you complete focus sessions, unlock pixel furniture, and share your craft journey with friends."
        />
        <meta name="theme-color" content="#B14C2F" />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href="https://example.com/" />
        <meta property="og:title" content="CraftFocus" />
        <meta
          property="og:description"
          content="Focus sessions, pixel rooms, and craft sharing in one cross-platform app."
        />
        <meta property="og:type" content="website" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
:root {
  --bg: #f2ebdd;
  --ink: #2a1e17;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(177, 76, 47, 0.18), transparent 34%),
    radial-gradient(circle at 80% 10%, rgba(62, 127, 87, 0.15), transparent 30%),
    repeating-linear-gradient(0deg, rgba(120, 94, 70, 0.08), rgba(120, 94, 70, 0.08) 1px, transparent 1px, transparent 14px),
    var(--bg);
  color: var(--ink);
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes pageReveal {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  #root {
    animation: pageReveal 320ms ease-out;
  }
}
`;
