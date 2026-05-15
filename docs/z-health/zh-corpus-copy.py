#!/usr/bin/env python3
"""
Copy the full Z-Health corpus (41,041 vectors) from zhealth_research_nomic
into zhealth_research — the collection AnythingLLM's Z-Health workspace
actually queries for native RAG.

Additive: does not touch the 7 vectors already in zhealth_research
(6 working documents, one of which chunked into 2).
Both collections are 768-dim / Cosine, verified before run.
"""
import json, urllib.request, sys

QDRANT = "http://localhost:6333"
SRC = "zhealth_research_nomic"
DST = "zhealth_research"
BATCH = 1000


def post(path, body):
    req = urllib.request.Request(
        f"{QDRANT}{path}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def put(path, body):
    req = urllib.request.Request(
        f"{QDRANT}{path}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main():
    offset = None
    copied = 0
    batch_num = 0
    while True:
        scroll_body = {
            "limit": BATCH,
            "with_payload": True,
            "with_vector": True,
        }
        if offset is not None:
            scroll_body["offset"] = offset

        res = post(f"/collections/{SRC}/points/scroll", scroll_body)["result"]
        points = res.get("points", [])
        if not points:
            break

        upsert_points = [
            {"id": p["id"], "vector": p["vector"], "payload": p.get("payload", {})}
            for p in points
        ]
        result = put(
            f"/collections/{DST}/points?wait=true",
            {"points": upsert_points},
        )
        status = result.get("result", {}).get("status")
        if status != "completed":
            print(f"ERROR: batch {batch_num} upsert status={status}", file=sys.stderr)
            sys.exit(1)

        copied += len(points)
        batch_num += 1
        print(f"  batch {batch_num}: +{len(points)} (total {copied})")

        offset = res.get("next_page_offset")
        if offset is None:
            break

    print(f"Done. Copied {copied} vectors {SRC} -> {DST}.")


if __name__ == "__main__":
    main()
