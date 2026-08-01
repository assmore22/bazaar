# Bazaar

Marketplace listings with provenance checks before settlement.

Bazaar is a marketplace review layer. Listings can carry assets, source proof, reservations and GenLayer decisions before a listing becomes final.

## Review Links

| Surface | Link |
| --- | --- |
| Live app | https://bazaar-provenance.vercel.app |
| GitHub | https://github.com/assmore22/bazaar |
| Contract | https://explorer-studio.genlayer.com/address/0x65135bB831a542551BdD2CAb83834c5f16E2A107 |

## Chain Record

- Network: GenLayer Studionet
- Chain ID: 61999
- Contract: `0x65135bB831a542551BdD2CAb83834c5f16E2A107`
- Deploy transaction: [0x75c8a8b3...5b8e74](https://explorer-studio.genlayer.com/tx/0x75c8a8b307d9b45041857be2c296c733824d0d3af69230875d7a9517c55b8e74)
- Deployed: `2026-06-23T21:06:44.203Z`
- Source: `contracts/bazaar_v2.py` (38,821 bytes)

## Protocol Path

1. Set marketplace standard.
2. Draft a listing.
3. Add asset and source proof.
4. Reserve the item.
5. Review, challenge and finalize.

The frontend reads listing status, asset records, reservations and party-indexed history. Contract state is public; write actions still require a connected wallet on GenLayer Studionet.

## Finalized Smoke

| Action | Transaction |
| --- | --- |
| `set_bazaar_standard` | [0xa9f3d780...e4ec70](https://explorer-studio.genlayer.com/tx/0xa9f3d78028b3d91b3141a7fc5bed66b8bf01e4d851b2dc4be154083a13e4ec70) |
| `draft_listing` | [0x00025617...fefc90](https://explorer-studio.genlayer.com/tx/0x000256175f42577f845315fa9c137ffdae3e082ed5ac4b26df96d66ddcfefc90) |
| `add_asset` | [0x9e5a0586...27b94d](https://explorer-studio.genlayer.com/tx/0x9e5a058631c9e1ef685d82d088b7ad4d9704939bf342ed0a7b8019a79827b94d) |
| `add_evidence_docs` | [0x61eb5cfa...07efd8](https://explorer-studio.genlayer.com/tx/0x61eb5cfa4315bac0af7655db3d3b6948d485f8d9d122469cbc6e4e7c5607efd8) |
| `add_evidence_site` | [0xd3c63953...7fa1f1](https://explorer-studio.genlayer.com/tx/0xd3c63953d05e660d58e481928b3482c456ace66973988e6a92fce3e1ea7fa1f1) |
| `reserve_item` | [0xfbb05bf9...82fbf1](https://explorer-studio.genlayer.com/tx/0xfbb05bf91166ed3e95801cc14cd3d98f8ae1b42fb6ab0bcdb37c78a54282fbf1) |

## Local Run

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Release Hygiene

The public package is static and has no install step. Vercel receives only frontend, contract source and public deployment metadata.

Keep wallet private keys, vault exports, `.env` files, Vercel project state and dashboard data out of Git. This repository is for public source, UI, tests and deployment receipts only.
