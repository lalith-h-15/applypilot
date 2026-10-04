"""
Security and Cryptographic Integrity Module for ApplyPilot - Vikas Module.

Handles:
- Canonical SHA-256 integrity hash calculation
- Single-use cryptographically secure approval token generation
- Deadline enforcement logic
- Application payload canonicalization

FIX: generate_submission_identifiers() return-type annotation corrected to
     Tuple[str] (one value) and the function signature simplified.
"""

import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple


def generate_canonical_payload(application_data: Dict[str, Any]) -> Tuple[str, str]:
    """
    Produces a deterministic, canonical JSON string and its SHA-256 digest
    over the core application fields.

    Returns:
        (canonical_json_str, sha256_hex_digest)
    """
    canonical_dict: Dict[str, Any] = {
        "application_id": application_data.get("id"),
        "candidate_id": application_data.get("candidate_id"),
        "target_company": application_data.get("target_company"),
        "target_role": application_data.get("target_role"),
        "version_number": int(application_data.get("current_version", 1)),
        "opportunity_deadline": application_data.get("opportunity_deadline"),
        "answers": [],
    }

    # Normalise answer order to guarantee determinism
    for ans in sorted(
        application_data.get("answers", []),
        key=lambda x: str(x.get("question_id", "")),
    ):
        canonical_dict["answers"].append(
            {
                "question_id": ans.get("question_id"),
                "question_text": ans.get("question_text", "").strip(),
                "answer_text": ans.get("answer_text", "").strip(),
            }
        )

    canonical_str = json.dumps(canonical_dict, sort_keys=True, separators=(",", ":"))
    sha256_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
    return canonical_str, sha256_hash


def generate_approval_token(
    application_id: str,
    version: int,
    integrity_hash: str,
) -> Tuple[str, str, str]:
    """
    Generates a cryptographically strong, single-use approval token
    bound to the specific application version and integrity hash.

    Returns:
        (token, generated_at_iso, expires_at_iso)
    """
    random_entropy = secrets.token_hex(16)
    short_hash = integrity_hash[:8]
    token = f"appr_tok_v{version}_{short_hash}_{random_entropy}"

    now = datetime.now(timezone.utc)
    generated_at = now.isoformat()
    expires_at = (now + timedelta(hours=2)).isoformat()
    return token, generated_at, expires_at


def is_deadline_expired(deadline_iso_str: str) -> Tuple[bool, str]:
    """
    Checks whether the opportunity deadline has already passed.

    Returns:
        (is_expired: bool, explanation: str)
    """
    try:
        deadline_clean = deadline_iso_str.replace("Z", "+00:00")
        deadline_dt = datetime.fromisoformat(deadline_clean)
        if deadline_dt.tzinfo is None:
            deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if now > deadline_dt:
            diff = int((now - deadline_dt).total_seconds())
            return True, f"Deadline passed {diff} seconds ago at {deadline_iso_str}"
        else:
            diff = int((deadline_dt - now).total_seconds())
            return False, f"Deadline is valid (expires in {diff} seconds)"
    except Exception as exc:
        return False, f"Could not parse deadline format: {exc}"


def generate_receipt_id() -> str:
    """
    Generates a unique, human-readable Submission Receipt ID.

    FIX: was annotated as Tuple[str, str] but only returned one value.
         Renamed and corrected.
    """
    entropy = secrets.token_hex(4).upper()
    return f"RCPT-{entropy}-2026"
