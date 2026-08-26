import csv
import json
import re
import sys
from pathlib import Path


if len(sys.argv) != 3:
    raise SystemExit("Usage: prepare-flashcard-refresh.py BACKUP.json OUTPUT_DIR")

backup_path = Path(sys.argv[1]).resolve()
output_dir = Path(sys.argv[2]).resolve()
output_dir.mkdir(parents=True, exist_ok=True)

with backup_path.open(encoding="utf-8") as handle:
    backup = json.load(handle)

deleted_ids = {
    # Thesis-writing concepts already covered by Thesis and Contestable claim.
    "35e26dc0-eea0-4f81-9705-ce19d9d51864",  # The disagreement test
    "4273a2a5-db6e-402b-9762-c8cc0ab0b52a",  # Grounds
    "e3ee3319-687d-4ee3-b742-8ba77f2befe6",  # Cost of a claim
    "4ce427e2-d989-4cf3-9607-2e81e5aa85d3",  # Turning a topic into a claim
    # Four transition families and decorative connectives are consolidated below.
    "9dc93bfb-b7ed-4ee1-9c12-a20d6e5220a1",  # Decorative connective
    "8062975b-e79d-4431-b3f3-04dc489fd9f8",  # Add family
    "fcb34512-edd7-4bcd-926a-0d1f42d663dc",  # Contrast family
    "9c2cdd21-8e43-4914-8a67-4d7385761652",  # Cause family
    "5d27c690-c2aa-4232-96d0-f1200eef5232",  # Sequence family
}

overrides = {
    "3a3573f7-4c9e-48ea-9a52-8bc7d9196774": {
        "definition": "A deductive argument is valid when true premises would make a false conclusion impossible.",
    },
    "f2208346-73c4-4e1d-b1a2-448316d5b2da": {
        "definition": "An ancient Mesopotamian epic about a king who seeks glory, then immortality.",
    },
    "66095c85-3608-4cc1-b1a8-3dba50cb56c9": {
        "definition": "The wild man created as Gilgamesh's equal whose friendship and death transform the king.",
    },
    "a10b7645-dc8c-4ede-a9bc-0021693d1443": {
        "definition": "The specific readers or listeners whose needs and beliefs shape a message.",
    },
    "be5d6a6a-6a2c-41d7-80db-ff876d993994": {
        "term": "Transition relationships",
        "definition": "Choose a transition only after deciding whether ideas add, contrast, cause, or follow in sequence.",
        "example": "The second idea contradicts the first, so 'however' fits; 'furthermore' would point the reader the wrong way.",
    },
    "74e97e0d-b0b6-4289-b7c1-66a4380f9f29": {
        "definition": "A revision check that reads each sentence's first four words to test how ideas connect.",
    },
    "0e998dc3-166a-49a4-9a29-311bd21715d5": {
        "definition": "A monster embodies the opposite of the values its culture considers human and good.",
    },
    "e39c7bc7-c2b0-46cc-9d10-ccdd139328a7": {
        "definition": "Ask what a monster lacks, where it lives, and why it frightens the culture that imagined it.",
    },
    "ba38f3e6-b190-4438-9bb6-e93581d3df6c": {
        "definition": "Having no family, leader, or community, presented as a terrible fate.",
    },
    "029f3398-d143-4010-bbb7-1e67715d4269": {
        "definition": "Advice that mortals should accept death and value ordinary pleasures, family, and daily life.",
    },
}


def split_card(card):
    parts = re.split(r"\n\s*\n", card.get("back", "").strip(), maxsplit=1)
    if len(parts) != 2 or not all(parts):
        raise ValueError(f"Card {card['$id']} does not contain one definition and one example")
    return parts[0].strip(), parts[1].strip()


decks_by_id = {deck["$id"]: deck for deck in backup["decks"]}
cards_by_deck = {deck_id: [] for deck_id in decks_by_id}
plan = {"sourceBackup": str(backup_path), "decks": [], "updates": [], "deletes": sorted(deleted_ids)}

for card in backup["cards"]:
    if card["$id"] in deleted_ids:
        continue
    definition, example = split_card(card)
    override = overrides.get(card["$id"], {})
    row = {
        "id": card["$id"],
        "deckId": card["deckId"],
        "term": override.get("term", card["front"].strip()),
        "definition": override.get("definition", definition),
        "example": override.get("example", example),
        "sortOrder": card.get("sortOrder", 0),
    }
    cards_by_deck[card["deckId"]].append(row)

for deck in backup["decks"]:
    rows = sorted(cards_by_deck[deck["$id"]], key=lambda row: row["sortOrder"])
    slug = re.sub(r"[^a-z0-9]+", "-", deck["title"].lower()).strip("-")
    csv_path = output_dir / f"{slug}_flashcards.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Term", "Definition", "Example"])
        writer.writeheader()
        for index, row in enumerate(rows):
            writer.writerow({"Term": row["term"], "Definition": row["definition"], "Example": row["example"]})
            plan["updates"].append({**row, "sortOrder": index})
    plan["decks"].append({"id": deck["$id"], "title": deck["title"], "cards": len(rows), "csv": str(csv_path)})

plan_path = output_dir / "flashcard-refresh-plan.json"
with plan_path.open("w", encoding="utf-8") as handle:
    json.dump(plan, handle, ensure_ascii=False, indent=2)
    handle.write("\n")

print(json.dumps({"plan": str(plan_path), "decks": len(plan["decks"]), "updates": len(plan["updates"]), "deletes": len(plan["deletes"])}))
