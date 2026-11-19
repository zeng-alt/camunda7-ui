# Changelog

## 1.0.9

- Align `diagram-js` to 15.24.0 to satisfy the canvas-lock dependency used by token simulation.
- Add API Extractor 7.58.2, matching TypeScript 5.9.3, so library builds include bundled declarations.
- Add GitHub Actions CI for type checks, tests, builds, and npm package inspection.
- Add tag-triggered npm publishing with OIDC Trusted Publishing; release tags must match the package version.
- Pin pnpm 10.33.0 and document the release process.
