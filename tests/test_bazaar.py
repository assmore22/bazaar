"""Tests for BAZAAR (direct runner). AI confirm() validated live on studionet."""
from pathlib import Path

CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "bazaar.py")
GEN = 10 ** 18
S_LISTED = 0; S_SOLD = 1; S_DELIVERED = 2; S_REFUNDED = 3; S_CANCELLED = 4


def _list(b, vm, who, title="Logo pack", desc="20 SVG logos", url="https://example.com", cat="design", price=3):
    vm.sender = who
    return b.list_item(title, desc, url, cat, price * GEN)


def test_list_item(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    iid = _list(b, direct_vm, direct_alice)
    assert iid == 0
    it = b.get_item(0)
    assert it["status"] == S_LISTED
    assert int(it["price"]) == 3 * GEN
    assert it["category"] == "design"


def test_list_requires_price(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("price must be positive"):
        b.list_item("t", "d", "https://x.com", "c", 0)


def test_list_requires_proof(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("a proof URL is required"):
        b.list_item("t", "d", "", "c", GEN)


def test_buy(deploy, direct_vm, direct_alice, direct_bob):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    direct_vm.value = 3 * GEN
    b.buy(0)
    direct_vm.value = 0
    it = b.get_item(0)
    assert it["status"] == S_SOLD
    assert it["buyer"] != "0x0000000000000000000000000000000000000000"


def test_cannot_buy_own(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 3 * GEN
    with direct_vm.expect_revert("cannot buy your own"):
        b.buy(0)
    direct_vm.value = 0


def test_buy_must_match_price(deploy, direct_vm, direct_alice, direct_bob):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    direct_vm.value = 1 * GEN
    with direct_vm.expect_revert("pay exactly the price"):
        b.buy(0)
    direct_vm.value = 0


def test_cancel(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    b.cancel(0)
    assert b.get_item(0)["status"] == S_CANCELLED


def test_confirm_requires_sold(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("not awaiting confirmation"):
        b.confirm(0)


def test_multiple(deploy, direct_vm, direct_alice):
    b = deploy(CONTRACT)
    _list(b, direct_vm, direct_alice, title="Item A")
    _list(b, direct_vm, direct_alice, title="Item B")
    assert b.get_item_count() == 2
    assert b.get_item(1)["title"] == "Item B"
