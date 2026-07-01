# Bazaar V2

A GenLayer verified marketplace.

The repo combines a public frontend with an intelligent contract that tracks stakes, evidence, review state and final outcomes.

## Bazaar Brief

- Project folder: `projects/22-bazaar`
- Frontend: static browser app
- Contract package: `contracts/` plus `deployment.json`
- Build status: Schema-valid (38821 bytes, 20 write + 20 view); clean redeploy + 18 write smoke txs finalized incl 3 GenLayer reasoning calls and legacy list/cancel; 35/35 read tests passed; app.js repointed.
- QA notes: Upgraded from a compact marketplace MVP into Bazaar V2. Smoke: set_bazaar_standard / draft_listing / add_asset / two add_evidence calls / reserve_item / open_review / review_listing_with_genlayer / open_challenge_window / submit_challenge / resolve_challeng...

## Deployment Evidence

- Network: studionet (61999)
- Contract: [0x65135bB831a542551BdD2CAb83834c5f16E2A107](https://explorer-studio.genlayer.com/contracts/0x65135bB831a542551BdD2CAb83834c5f16E2A107)
- Deploy tx: [0x75c8a8b3...5b8e74](https://explorer-studio.genlayer.com/tx/0x75c8a8b307d9b45041857be2c296c733824d0d3af69230875d7a9517c55b8e74)
- Deployed at: 2026-06-23T21:06:44.203Z
- Smoke writes recorded: 18

## Market Mechanics

- Primary source: `contracts/bazaar_v2.py` (38,821 bytes)
- Public write/action methods: 20
- Read methods: 20
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

Typical flow: `open_listing` -> `submit_challenge` -> `open_review` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_listing`

Useful reads: `get_listing_count`, `get_listing`, `get_item_count`, `get_item`, `get_listing_record`, `get_recent_listings`, `get_listings_by_status`, `get_party_listings`

The contract is deliberately larger than a one-method demo. It keeps lifecycle state, evidence records and read endpoints so the UI can show real project state instead of static copy.

## Operator Preview

```powershell
cd <private-workspace-root>
npm run preview:start
npm run preview:project -- 22-bazaar
```

Open http://localhost:8080/22-bazaar/.

## Smoke Transactions

- set_bazaar_standard: [0xa9f3d780...e4ec70](https://explorer-studio.genlayer.com/tx/0xa9f3d78028b3d91b3141a7fc5bed66b8bf01e4d851b2dc4be154083a13e4ec70)
- draft_listing: [0x00025617...fefc90](https://explorer-studio.genlayer.com/tx/0x000256175f42577f845315fa9c137ffdae3e082ed5ac4b26df96d66ddcfefc90)
- add_asset: [0x9e5a0586...27b94d](https://explorer-studio.genlayer.com/tx/0x9e5a058631c9e1ef685d82d088b7ad4d9704939bf342ed0a7b8019a79827b94d)
- add_evidence_docs: [0x61eb5cfa...07efd8](https://explorer-studio.genlayer.com/tx/0x61eb5cfa4315bac0af7655db3d3b6948d485f8d9d122469cbc6e4e7c5607efd8)
- add_evidence_site: [0xd3c63953...7fa1f1](https://explorer-studio.genlayer.com/tx/0xd3c63953d05e660d58e481928b3482c456ace66973988e6a92fce3e1ea7fa1f1)
- reserve_item: [0xfbb05bf9...82fbf1](https://explorer-studio.genlayer.com/tx/0xfbb05bf91166ed3e95801cc14cd3d98f8ae1b42fb6ab0bcdb37c78a54282fbf1)
- open_review: [0x48dbcbda...c5ab71](https://explorer-studio.genlayer.com/tx/0x48dbcbdad1e202cb874a47c56425d35f33870ae5dd26c26885aefc517bc5ab71)
- review: [0xc53a6944...c8fb83](https://explorer-studio.genlayer.com/tx/0xc53a694411eee23df12ec55b281be1e40e4c5efbb2a3d2895ab0e30854c8fb83)

## Release Command

```powershell
cd <private-workspace-root>
npm run publish:project -- -Project 22-bazaar -Repo https://github.com/aspro45/<repo-name>.git
```

Replace `<repo-name>` with the GitHub repository name before publishing.

## Public Repo Safety

- Private keys and local vault files are not part of this repository.
- Public addresses, contract source, deployment metadata and frontend code are safe to publish.
- Vercel should receive only this project folder, never the workspace dashboard or vault data.
