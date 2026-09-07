# UI Wireframes & Workflow Planning
## PricePilot AI — Milestone 1

## Approach

For this project, UI wireframes and final interface design were developed together rather than as separate sequential steps. Layout structure, navigation flow, and page hierarchy were planned directly within the implementation, using the actual production tech stack (Next.js + Tailwind CSS) as the design tool itself. This ensured the wireframed structure and the final polished UI remained perfectly consistent, with no translation loss between planning and build.

## Workflow Planning

### User Flow

Login Page → Authentication (JWT) → Dashboard → Product Catalog View


### Page Structure Planned & Implemented

**1. Login Page** (`/login`)
- Split-screen layout: brand/data panel (left) + authentication form (right)
- Brand panel: logo, value proposition headline, live dataset registry (6 datasets, real record counts), status indicator
- Form panel: username/password inputs, sign-in button, role indicator footer

**2. Dashboard Page** (`/dashboard`)
- Top navigation: logo, authenticated user identity (username + role), sign-out action
- Main content area: product catalog header (dynamic count), responsive grid of product cards
- Product card structure: name/category/brand header, price comparison block (current vs. base price), inventory indicator

### Design System Defined
- **Color palette:** Near-black background, emerald/teal primary accent, violet secondary accent (used sparingly for hierarchy)
- **Component patterns:** Glass cards (bordered, elevated), terminal-style data panels (monospace, ledger format), status indicators (live pulse dots)
- **Typography hierarchy:** Bold sans-serif headings, muted body text, monospace for data/metrics

## Screenshots

*(Reference: actual implemented pages, serving as both wireframe and final design — see `/login` and `/dashboard` running at localhost during development)*

## Rationale

Given the project's compressed timeline and the availability of a modern component-based framework (Next.js + Tailwind), building directly in the target stack allowed for faster iteration and immediate validation of layout decisions against real data (actual dataset names, record counts, and product records from the PostgreSQL database), rather than working with placeholder content in a separate design tool.