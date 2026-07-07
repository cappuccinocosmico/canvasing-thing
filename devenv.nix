{ pkgs, lib, config, inputs, ... }:

let
  pkgs-playwright = import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
  playwright-pkg = pkgs-playwright.playwright;
  # browsersJSON is exposed as an attrset (not a JSON file) in modern nixpkgs.
  chromiumRevision = playwright-pkg.browsersJSON.chromium.revision;
in
{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # Tell Playwright where to find the nixpkgs-bundled chromium and to skip
  # the host-requirements check (system libs are all provided by nix).
  # See https://wiki.nixos.org/wiki/Playwright
  env.PLAYWRIGHT_BROWSERS_PATH = "${playwright-pkg.browsers}";
  env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
  env.PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs_24}/bin/node";
  env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH =
    "${playwright-pkg.browsers}/chromium-${chromiumRevision}/chrome-linux64/chrome";

  # https://devenv.sh/packages/
  packages = [ pkgs.git ];

  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    pnpm = {
      enable = true;
      install.enable = true;
    };
    npm.install.enable = false;
  };

  # https://devenv.sh/scripts/
  scripts.hello.exec = ''
    echo hello from $GREET
  '';

  # Warn early if the nixpkgs-pinned playwright drifts from the npm version.
  scripts.playwright-version-check.exec = ''
    nix_version="${playwright-pkg.version}"
    npm_version="$(node -p "require('playwright/package.json').version" 2>/dev/null || echo missing)"
    echo "playwright nix:    $nix_version"
    echo "playwright npm:    $npm_version"
    if [ "$npm_version" != "$nix_version" ]; then
      echo "WARNING: playwright versions differ; update nixpkgs-playwright in devenv.yaml and package.json together."
    fi
  '';

  # https://devenv.sh/basics/
  enterShell = ''
    hello         # Run scripts directly
    git --version # Use packages
    node --version
    pnpm --version
  '';

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # See full reference at https://devenv.sh/reference/options/
}
