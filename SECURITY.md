# Security model

LocaleProof 0.1 is a single-owner application. It is not a public, anonymous scanning service or a multi-tenant SaaS.

## Application controls

- All live scan, history, retry, and screenshot routes require a bearer token of 32–256 characters. Token comparison uses constant-time byte comparison. Missing configuration fails closed.
- The token lives only in the owner's page memory, never in localStorage, a URL, or public runtime configuration.
- Scan bodies are bounded to 16 KB while reading, then validated. Project size is limited to five pairs. URLs must be unique, HTTPS, approved hosts, and contain no credentials, custom ports, or fragments.
- SQL values use parameters. Transactions prevent partial project/report writes. Foreign keys, check constraints, and unique indexes enforce relationships and one active scan per project.
- The queue admits at most ten queued/running scans. A bounded process-local limiter protects owner endpoints. Deploy an edge limiter before exposing the service publicly; the app intentionally does not trust forwarded IP headers.
- Vue text interpolation escapes evidence. No scanned HTML is injected into the application. Demo frames are sandboxed. Screenshot filenames and scan IDs are strictly validated.
- Production CSP restricts scripts to the same origin and hashes of the rendered bootstrap. Inline styles remain allowed for Vue/GSAP style updates. Responses include nosniff, referrer, frame, and permissions policies. Private API responses are not cached.

## Scanner boundaries

Every intercepted HTTP request is limited to an exact approved host. DNS answers must all be public. The HTTPS connection is pinned to the validated IP, preventing a second DNS lookup from changing the destination. Redirect destinations are checked again as browser requests. TLS verification remains enabled.

Only GET requests are supported. Service workers and WebSockets are blocked; non-proxied WebRTC is disabled. Pages have request, byte, concurrency, and time budgets. Chromium sandboxing is enabled. Browser contexts are isolated and closed after inspection. Reports identify blocked resources because these can affect results.

Application checks are defense in depth, not a browser containment guarantee. Run the worker as an unprivileged account in a dedicated isolated environment, with network egress rules blocking private networks and metadata endpoints. Do not mount unrelated secrets or personal files. Do not disable the browser sandbox to make a deployment work.

## Deployment responsibilities

Use HTTPS, private database connectivity, least-privilege database credentials, managed secret storage, backups, a storage retention policy, and operating-system/browser updates. Screenshot evidence can contain personal information; limit approved targets accordingly. The shared owner token is appropriate only for one trusted operator. Add real user authentication and per-user authorization before inviting other operators.

The default Compose database password is for loopback-only development. Do not reuse it in production. Keep `.env`, screenshots, and database files out of git. `EVIDENCE_DIR` needs a persistent volume shared by the app and worker. Local storage is an explicit first-release limitation.

## Reporting

Do not post credentials or exploit details in public issues. Contact the maintainer through the contact information on their GitHub profile and provide a minimal reproduction privately. This repository does not claim an independent penetration test or complete security certification.

## Open dependency advisories (2026-10-22)

The full dependency audit currently reports high-severity advisories in Nuxt's
transitive tooling dependencies. No patched versions are listed upstream:

- [braces: recursive pattern denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [node-forge: RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)

Nuxt is a development dependency: production runs the built Node server, not the
Nuxt CLI. Neither package is present in the inspected server artifact. The worker
uses Playwright, PostgreSQL and the network validation library without Nuxt.

CI runs strict high-severity audits on both application/worker production
dependencies and the built server dependency manifest. These audits have no
exceptions. The full tooling audit reports the two exact advisories above as
visible warnings until **2026-11-21**. It fails for any new advisory, critical
severity, audit service error, expired review, or detected inclusion of either
package in the server output. This accepts a temporary build-environment risk;
it does not claim the dependencies are patched. Builds must use trusted source,
never untrusted glob patterns or development HTTPS certificates as a production
security boundary. Reassess and remove the exceptions when upstream fixes exist.
