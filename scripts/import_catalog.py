"""Build a card-name index for the 15th anniversary A/B hand-card decks.

The generated file contains identifiers, English titles and source links only.
Card artwork, text and effects remain on the linked reference pages.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.request import urlopen


SOURCE = "https://agricola.cloudfree.jp/cardlist_en/"
ROOT = Path(__file__).resolve().parents[1]


def plain(markup: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", " ", markup)).strip()


def main() -> None:
    with urlopen(SOURCE, timeout=30) as response:
        page = response.read().decode("utf-8")
    cards = []
    for row in re.findall(r"<tr>(.*?)</tr>", page, re.S):
        raw = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        cells = [plain(cell) for cell in raw]
        if len(cells) < 6 or not re.fullmatch(r"[AB]\d{3}", cells[2]):
            continue
        link = re.search(r"href=['\"]([^'\"]+)", raw[3])
        cards.append({
            "id": cells[2],
            "name": cells[4],
            "kind": "minor" if int(cells[2][1:]) <= 84 else "occupation",
            "url": link.group(1) if link else SOURCE,
        })
    # A113 is omitted from this BGA list; the revised compendium identifies it.
    cards.append({
        "id": "A113",
        "name": "Heresy Teacher",
        "kind": "occupation",
        "url": "https://www.scribd.com/document/749914746/Agricola-Revised-Edition-Unofficial-Compendium-v4-1",
    })
    cards.sort(key=lambda card: card["id"])
    ids = [card["id"] for card in cards]
    expected = [f"{deck}{n:03d}" for deck in "AB" for n in range(1, 169)]
    if ids != expected:
        raise ValueError(f"Card index incomplete or duplicated: {len(ids)} entries")
    output = ROOT / "card-catalog.js"
    output.write_text("// A/B card-name index; see README for source and scope.\nwindow.ORIGINAL_CARD_CATALOG = " + json.dumps(cards, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Wrote {len(cards)} card names to {output}")


if __name__ == "__main__":
    main()
