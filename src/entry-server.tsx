// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" data-theme="corporate">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <title>Canvasing Thing</title>
          {assets}
        </head>
        <body class="min-h-screen bg-base-100 text-base-content">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
