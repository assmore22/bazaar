# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
BAZAAR - AI-Verified Peer Marketplace
=====================================
A seller lists a digital item with a description and a public proof URL (where the
deliverable lives). A buyer purchases it, locking payment in escrow. To settle,
the contract reads the proof URL and a validator set agrees (Equivalence
Principle) whether it genuinely delivers what was described. Matches -> the seller
is paid. Does not -> the buyer is refunded. A marketplace where the listing has to
be true.

Item status:  LISTED(0) -> SOLD(1) -> DELIVERED(2, paid seller) | REFUNDED(3) ; or CANCELLED(4)
"""

from genlayer import *
from dataclasses import dataclass
import json
import typing


S_LISTED = 0
S_SOLD = 1
S_DELIVERED = 2
S_REFUNDED = 3
S_CANCELLED = 4


@allow_storage
@dataclass
class Item:
    seller: Address
    buyer: Address
    title: str
    description: str
    proof_url: str
    category: str
    price: u256
    status: u8
    rationale: str


class Bazaar(gl.Contract):
    items: DynArray[Item]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def list_item(self, title: str, description: str, proof_url: str, category: str, price: int) -> int:
        if len(title.strip()) == 0:
            raise gl.vm.UserError("a title is required")
        if len(description.strip()) == 0:
            raise gl.vm.UserError("a description is required")
        if len(proof_url.strip()) == 0:
            raise gl.vm.UserError("a proof URL is required")
        if price <= 0:
            raise gl.vm.UserError("price must be positive")
        it = self.items.append_new_get()
        it.seller = gl.message.sender_address
        it.buyer = Address(bytes(20))
        it.title = title
        it.description = description
        it.proof_url = proof_url
        it.category = category if len(category.strip()) else "general"
        it.price = u256(price)
        it.status = u8(S_LISTED)
        it.rationale = ""
        return len(self.items) - 1

    @gl.public.write.payable
    def buy(self, item_id: int) -> None:
        it = self._get(item_id)
        if it.status != S_LISTED:
            raise gl.vm.UserError("item is not available")
        if gl.message.sender_address == it.seller:
            raise gl.vm.UserError("you cannot buy your own item")
        if gl.message.value != it.price:
            raise gl.vm.UserError("you must pay exactly the price")
        it.buyer = gl.message.sender_address
        it.status = u8(S_SOLD)

    @gl.public.write
    def confirm(self, item_id: int) -> None:
        """Read the proof URL; validators agree whether it delivers what was
        described. Yes -> pay the seller. No -> refund the buyer."""
        it = self._get(item_id)
        if it.status != S_SOLD:
            raise gl.vm.UserError("item is not awaiting confirmation")

        title = it.title
        desc = it.description
        url = it.proof_url

        def leader_fn() -> str:
            page = ""
            try:
                page = gl.nondet.web.get(url).body.decode("utf-8")[:6000]
            except Exception:
                page = "(deliverable page unreachable)"
            prompt = (
                f"Marketplace listing title: {title}\n"
                f"What it promises:\n{desc}\n\n"
                f"Deliverable page at the proof URL:\n{page}\n\n"
                "Does the deliverable genuinely match what the listing promised? "
                "Judge strictly on the page. Reply with ONLY JSON: "
                '{"delivered": true} if it matches, {"delivered": false} if it does '
                'not, plus a short "reason".'
            )
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            return self._decision_of(leader_res.calldata)[0] == self._decision_of(leader_fn())[0]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        delivered, reason = self._decision_of(result)
        it.rationale = reason[:300]
        if delivered:
            it.status = u8(S_DELIVERED)
            self._pay(it.seller, it.price)
        else:
            it.status = u8(S_REFUNDED)
            self._pay(it.buyer, it.price)

    @gl.public.write
    def cancel(self, item_id: int) -> None:
        it = self._get(item_id)
        if it.status != S_LISTED:
            raise gl.vm.UserError("only a listed item can be cancelled")
        if gl.message.sender_address != it.seller:
            raise gl.vm.UserError("only the seller can cancel")
        it.status = u8(S_CANCELLED)

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_item_count(self) -> int:
        return len(self.items)

    @gl.public.view
    def get_item(self, item_id: int) -> dict:
        it = self._get(item_id)
        return {
            "seller": it.seller.as_hex,
            "buyer": it.buyer.as_hex,
            "title": it.title,
            "description": it.description,
            "proof_url": it.proof_url,
            "category": it.category,
            "price": str(it.price),
            "status": int(it.status),
            "rationale": it.rationale,
        }

    # -------------------------------------------------------------- internals
    def _get(self, item_id: int) -> Item:
        if item_id < 0 or item_id >= len(self.items):
            raise gl.vm.UserError("no such item")
        return self.items[item_id]

    def _decision_of(self, result: typing.Any) -> tuple:
        data = result
        if isinstance(data, str):
            data = self._extract_json(data)
        if not isinstance(data, dict):
            return (False, "")
        raw = data.get("delivered", None)
        reason = str(data.get("reason", ""))
        if isinstance(raw, bool):
            return (raw, reason)
        if isinstance(raw, str):
            return (raw.strip().lower() == "true", reason)
        return (False, reason)

    def _extract_json(self, text: str) -> typing.Any:
        try:
            return json.loads(text)
        except (ValueError, TypeError):
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except (ValueError, TypeError):
                return None
        return None

    def _pay(self, recipient: Address, amount: u256) -> None:
        if amount == u256(0):
            return
        _Payee(recipient).emit_transfer(value=amount)


@gl.evm.contract_interface
class _Payee:
    class View:
        pass

    class Write:
        pass
