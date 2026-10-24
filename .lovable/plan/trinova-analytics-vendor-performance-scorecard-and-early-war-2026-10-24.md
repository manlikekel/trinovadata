# Trinova Analytics - Vendor Performance Scorecard and Early-Warning App

A working app for businesses (mainly oil and gas service companies) to score their vendors with real data and spot weak vendors early.

## What users can do
- **Sign up / sign in** with email and password. Each company's data is private to its own users.
- **Vendor categories**: starts with common categories (Oil and gas services, Logistics and dispatch, Equipment supply, Maintenance, HSE services, IT, Catering, Security). Users can add, rename or delete their own.
- **Vendors**: add, edit, archive vendors (name, ID code, category, contact, contract value).
- **Log jobs/deliveries** per vendor: date due, date delivered, quantity ordered vs delivered, damage or incident, HSE compliance (yes/no plus notes), quality rating 1-5.
- **Scoreboard (home dashboard)**:
  - Summary cards: average on-time-in-full score, incident rate, number of top performers, number of at-risk vendors.
  - Ranked vendor table with green / amber / red status, filters by date range, category and status.
- **Vendor profile**: score breakdown, trend chart over time, recent jobs, and automatic action notes (reward for top tier, warning and review for at-risk).
- **Early-warning list**: vendors that dropped into the at-risk tier or fell sharply versus the previous period.

## Scoring rules
- On-time-in-full: a job only passes if it is both on time and complete.
- Overall score = on-time-in-full x 50% + damage/incident-free rate x 30% + HSE compliance x 20%.
- Tiers: Elite at 95 or above, Standard 85-94, At-Risk below 85.

## Look and feel
Clean, professional and friendly: deep navy and teal matching the Trinova logo, clear numbers, colour-coded status, works on phone and desktop.

## Pages
- `/` public intro page with sign-in button
- `/auth` sign in / sign up
- `/dashboard` scoreboard
- `/vendors`, `/vendors/$id` list and profile
- `/categories` manage categories
- `/alerts` early warnings

## Technical details
- Enable Lovable Cloud: tables for organizations, memberships, categories, vendors, jobs; row-level security scoped to the user's organization; default categories seeded on signup.
- Scores computed in a shared function with unit tests for the formula and tier thresholds.
- Charts with recharts; shadcn components.
