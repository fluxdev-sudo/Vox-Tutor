#!/usr/bin/env python3
"""
Upload a question bank into Qdrant for VoxTutor's Placements screen.

Input file format — a flat JSON array, 3 entries per question (see
datay-labeled.json for a worked example):

    [
      {"q_id": 1, "question": "What is a stack?", "type": "ideal",
       "text": "A linear data structure that follows LIFO..."},
      {"q_id": 1, "question": "What is a stack?", "type": "acceptable",
       "text": "It's like a pile of plates..."},
      {"q_id": 1, "question": "What is a stack?", "type": "misconception",
       "text": "A stack processes elements first in, first out..."}
    ]

"type" must be exactly one of: ideal, acceptable, misconception.

Setup (one-time):
    pip install "qdrant-client[fastembed]==1.9.1"
    # newer qdrant-client releases removed the .add()/.query() helpers this
    # script relies on — 1.9.1 is the version this was built and tested against.

Usage:
    export QDRANT_URL=https://xxxx.aws.cloud.qdrant.io:6333
    export QDRANT_API_KEY=...
    python scripts/upload_questions.py path/to/your-questions.json
"""
import json
import os
import sys

try:
    import truststore
    truststore.inject_into_ssl()  # use the OS certificate store — fixes antivirus/corporate SSL-inspection proxies
except ImportError:
    pass

from qdrant_client import QdrantClient

# Must match COLLECTION in src/lib/qdrant.server.ts
COLLECTION = "voxtutor_answers"

# Must match the model in src/lib/embeddings.server.ts (Xenova/all-MiniLM-L6-v2
# is the Transformers.js port of this same model — same weights, same vector
# space). Changing one without the other breaks comparisons silently.
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

VALID_TYPES = {"ideal", "acceptable", "misconception"}

# Note: qdrant-client's fastembed integration (client.add()) stores vectors under
# a name derived from MODEL ("fast-<slugified-model-name>"), not as an unnamed
# default vector. src/lib/qdrant.server.ts's VECTOR_NAME constant on the Node
# side must match whatever that comes out to for MODEL — check with:
#   GET /collections/voxtutor_answers -> result.config.params.vectors


def load_rows(path: str) -> list[dict]:
    rows = json.loads(open(path, encoding="utf-8").read())
    if not isinstance(rows, list):
        raise SystemExit("Input file must be a JSON array.")
    for i, r in enumerate(rows):
        missing = [k for k in ("q_id", "question", "type", "text") if k not in r]
        if missing:
            raise SystemExit(f"Row {i} is missing fields: {missing}")
        if r["type"] not in VALID_TYPES:
            raise SystemExit(f"Row {i} has invalid type {r['type']!r}, must be one of {VALID_TYPES}")
    return rows


def get_client() -> QdrantClient:
    url, key = os.getenv("QDRANT_URL"), os.getenv("QDRANT_API_KEY")
    if not url:
        raise SystemExit("Set QDRANT_URL (and QDRANT_API_KEY) first.")
    return QdrantClient(url=url, api_key=key)


def upload(path: str) -> None:
    rows = load_rows(path)
    client = get_client()

    if client.collection_exists(COLLECTION):
        print(f"Collection '{COLLECTION}' already exists — deleting and re-uploading fresh.")
        client.delete_collection(COLLECTION)

    documents = [r["text"] for r in rows]
    metadata = [
        {"q_id": r["q_id"], "question": r["question"], "type": r["type"], "text": r["text"]}
        for r in rows
    ]
    ids = list(range(len(rows)))

    print(f"Embedding and uploading {len(rows)} rows (model: {MODEL})...")
    client.set_model(MODEL)
    client.add(collection_name=COLLECTION, documents=documents, metadata=metadata, ids=ids)

    # Required for the app's filtered lookups (by q_id, and by q_id + type).
    client.create_payload_index(collection_name=COLLECTION, field_name="q_id", field_schema="integer")
    client.create_payload_index(collection_name=COLLECTION, field_name="type", field_schema="keyword")

    n_questions = len({r["q_id"] for r in rows})
    print(f"Done. {n_questions} questions, {len(rows)} reference answers in '{COLLECTION}'.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/upload_questions.py path/to/your-questions.json")
    upload(sys.argv[1])
