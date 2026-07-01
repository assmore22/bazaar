"""Seed BAZAAR with real on-chain data on studionet."""
from pathlib import Path

from gltest_cli.config.general import get_general_config
from gltest_cli.config.user import load_user_config
from gltest import get_contract_factory, get_default_account, get_gl_client, create_account

ROOT = Path(__file__).resolve().parents[1]
ADDR = "0x717bCc1fD36A1ba03f9900Ef8AC1C24B1851c88b"
GEN = 10 ** 18
URL = "https://example.com"

cfg = load_user_config(str(ROOT / "gltest.config.yaml"))
get_general_config().user_config = cfg
factory = get_contract_factory(contract_file_path=str(ROOT / "contracts" / "bazaar.py"))
seller = get_default_account()
c = factory.build_contract(ADDR, account=seller)

ITEMS = [
    ("Reserved-domain reference page", "A public page that clearly states the domain is for use in illustrative examples in documents, with a link to more information.", "docs", 3 * GEN),
    ("Realtime analytics dashboard", "A live hosted dashboard showing traffic charts, KPIs and a data table that updates every minute.", "saas", 5 * GEN),
    ("Brand font bundle", "Twelve original OTF typeface files with license, delivered as a downloadable pack.", "design", 2 * GEN),
]


def main():
    if c.get_item_count().call() == 0:
        for (t, d, cat, p) in ITEMS:
            c.list_item(args=[t, d, URL, cat, p]).transact()
            print("listed:", t)

    buyer = create_account()
    try:
        get_gl_client().fund_account(buyer.address, 30 * GEN)
        print("funded buyer", buyer.address)
    except Exception as e:
        print("fund:", e)
    cb = factory.build_contract(ADDR, account=buyer)

    for iid in (0, 2):
        it = c.get_item(args=[iid]).call()
        if int(it["status"]) == 0:
            try:
                cb.buy(args=[iid]).transact(value=int(it["price"]))
                print("bought", iid)
            except Exception as e:
                print("buy", iid, "->", e)

    # confirm item 0 (description matches example.com) -> delivered
    it0 = c.get_item(args=[0]).call()
    if int(it0["status"]) == 1:
        print("confirming 0 (AI)...")
        try:
            c.confirm(args=[0]).transact()
        except Exception as e:
            print("confirm ->", e)

    for iid in range(c.get_item_count().call()):
        it = c.get_item(args=[iid]).call()
        print(iid, ["LISTED", "SOLD", "DELIVERED", "REFUNDED", "CANCELLED"][int(it["status"])], it["title"], "|", (it["rationale"] or "")[:46])


if __name__ == "__main__":
    main()
