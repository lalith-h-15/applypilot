"""
Claim validation and evidence verification engine for ApplyPilot - Vikas Module.

Core Rule:
Never convert a skill-list entry into an unsupported experience claim.
Example: 'React' in skills can support 'React is listed as a skill',
but cannot support 'I built applications using React'.
"""

import re
from typing import Dict, List, Any, Tuple

# Action verbs and phrases indicating an experiential / practical execution claim
EXPERIENCE_INDICATORS = [
    r"\bbuilt\b",
    r"\bdeveloped\b",
    r"\bengineered\b",
    r"\barchitected\b",
    r"\bdeployed\b",
    r"\bled\b",
    r"\bdesigned\b",
    r"\bimplemented\b",
    r"\bscaled\b",
    r"\bcreated\b",
    r"\bshipped\b",
    r"\bmaintained\b",
    r"\boptimized\b",
    r"\bin production\b",
    r"\busing [a-zA-Z0-9+#.]+ in (production|my job|work|a team)\b",
    r"\bworked with [a-zA-Z0-9+#.]+ at\b",
]

# Phrases that purely claim knowledge or listed skill
SKILL_KNOWLEDGE_INDICATORS = [
    r"\blisted as a skill\b",
    r"\bin my skills list\b",
    r"\btechnical skill\b",
    r"\bfamiliar with\b",
    r"\bknowledge of\b",
    r"\bproficient in\b",
    r"\bcore skillset\b",
    r"\btooling includes\b",
]

def classify_claim_type(claim_text: str) -> str:
    """Classifies whether a claim asserts practical experience vs skill knowledge."""
    claim_lower = claim_text.lower()

    # Check if explicitly phrased as a skill knowledge claim
    is_skill_phrased = any(re.search(pattern, claim_lower) for pattern in SKILL_KNOWLEDGE_INDICATORS)
    has_experience_verbs = any(re.search(pattern, claim_lower) for pattern in EXPERIENCE_INDICATORS)

    if has_experience_verbs and not is_skill_phrased:
        return "EXPERIENCE"
    elif is_skill_phrased and not has_experience_verbs:
        return "SKILL_KNOWLEDGE"
    elif has_experience_verbs and is_skill_phrased:
        # If mixed e.g. "I have skill in React and built an app" -> Experience claim requires experience backing!
        return "EXPERIENCE"
    else:
        # Default heuristics based on sentence structure
        if any(w in claim_lower for w in ["years of experience", "project", "client", "company", "system", "app"]):
            return "EXPERIENCE"
        return "GENERAL"

def find_technology_mentions(text: str, candidate_skills: List[str]) -> List[str]:
    """Finds which candidate skills are referenced in the text."""
    text_lower = text.lower()
    matched = []
    for skill in candidate_skills:
        # Match whole words or boundary
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            matched.append(skill)
    return matched

def find_experience_evidence(text: str, experiences: List[Dict[str, Any]], projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Searches verified work experiences and projects for backing evidence."""
    matched_evidence = []
    text_lower = text.lower()

    for exp in experiences:
        company = exp.get("company", "").lower()
        role = exp.get("role", "").lower()
        summary = exp.get("summary", "").lower()
        tech_used = [t.lower() for t in exp.get("technologies", [])]

        # Check if words/tech from this experience are in the claim text
        matches = [t for t in tech_used if t in text_lower]
        if company in text_lower or (len(matches) > 0 and any(w in text_lower for w in ["production", "engineered", "scaled", "architected", "team"])):
            matched_evidence.append({
                "type": "WORK_EXPERIENCE",
                "source": f"{exp.get('role')} at {exp.get('company')} ({exp.get('period')})",
                "verified": exp.get("verified", False),
                "matched_terms": matches,
                "summary": exp.get("summary")
            })

    for proj in projects:
        pname = proj.get("name", "").lower()
        tech_used = [t.lower() for t in proj.get("technologies", [])]
        matches = [t for t in tech_used if t in text_lower]
        if pname in text_lower or (len(matches) > 0 and "built" in text_lower):
            matched_evidence.append({
                "type": "PROJECT",
                "source": f"Project '{proj.get('name')}'",
                "verified": proj.get("verified", False),
                "matched_terms": matches,
                "repo_url": proj.get("repo_url", "")
            })

    return matched_evidence

def validate_claim(
    claim_text: str,
    candidate_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validates a single claim against the candidate's verified profile data.
    Strictly applies rule: Never convert a skill-list entry into an unsupported experience claim.
    """
    skills = candidate_profile.get("skills", [])
    experiences = candidate_profile.get("experience", [])
    projects = candidate_profile.get("projects", [])

    claim_type = classify_claim_type(claim_text)
    matched_skills = find_technology_mentions(claim_text, skills)
    experience_evidence = find_experience_evidence(claim_text, experiences, projects)

    result = {
        "claim_text": claim_text,
        "claim_type": claim_type,
        "matched_skills": matched_skills,
        "evidence": experience_evidence,
        "is_valid": False,
        "status": "UNSUPPORTED",
        "violation_code": None,
        "reason": "",
        "recommendation": ""
    }

    if claim_type == "EXPERIENCE":
        if experience_evidence:
            # Backed by real experience or verified project
            result["is_valid"] = True
            result["status"] = "SUPPORTED"
            result["reason"] = f"Supported by verified work experience: {experience_evidence[0]['source']}"
        elif matched_skills:
            # THIS IS THE CRITICAL RULE!
            # The technology is in the skills list, but user asserts an experience claim without role/project evidence.
            result["is_valid"] = False
            result["status"] = "UNSUPPORTED_EXPERIENCE_CLAIM"
            result["violation_code"] = "RULE_VIOLATION_SKILL_TO_EXPERIENCE"
            skills_str = ", ".join(matched_skills)
            result["reason"] = (
                f"STRICT SECURITY RULE: Never convert a skill-list entry into an unsupported experience claim. "
                f"'{skills_str}' is listed in technical skills, which confirms familiarity, but cannot support "
                f"an experiential claim ('{claim_text}') without verified job or project evidence."
            )
            result["recommendation"] = (
                f"Either rephrase to reflect listing: '{skills_str} is listed as a skill in my technical toolkit', "
                f"or link a verified project/work experience with verifiable code artifacts."
            )
        else:
            result["is_valid"] = False
            result["status"] = "UNSUPPORTED_FACT"
            result["violation_code"] = "NO_EVIDENCE_FOUND"
            result["reason"] = "No matching skill, project, or work experience found in candidate profile."
            result["recommendation"] = "Add supporting profile records or remove claim from answer."

    elif claim_type == "SKILL_KNOWLEDGE":
        if matched_skills:
            result["is_valid"] = True
            result["status"] = "SUPPORTED"
            result["reason"] = f"Valid claim. Matched technical skill in profile: {', '.join(matched_skills)}"
        else:
            result["is_valid"] = False
            result["status"] = "UNSUPPORTED_FACT"
            result["violation_code"] = "SKILL_NOT_IN_PROFILE"
            result["reason"] = "Claim asserts technical skill knowledge not found in candidate skills list."
            result["recommendation"] = "Add skill to candidate profile after verification."

    else: # GENERAL
        if experience_evidence or matched_skills:
            result["is_valid"] = True
            result["status"] = "SUPPORTED"
            result["reason"] = "Supported by profile records."
        else:
            result["is_valid"] = False
            result["status"] = "UNVERIFIED"
            result["reason"] = "General claim without direct corroborating profile evidence."

    return result

def evaluate_application_answers(
    answers: List[Dict[str, Any]],
    candidate_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates all questions/answers in an application:
    - Extracts claims
    - Validates each claim
    - Detects missing information
    - Computes overall preparation quality and readiness for approval
    """
    validated_answers = []
    all_claims = []
    missing_information = list(candidate_profile.get("missing_profile_fields", []))
    has_critical_violations = False
    unsupported_count = 0

    for ans in answers:
        q_id = ans.get("question_id")
        q_text = ans.get("question_text", "")
        answer_text = ans.get("answer_text", "")
        extracted_claims = ans.get("claims", [])

        # If claims not explicitly provided, split sentences into claims
        if not extracted_claims:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?]) +", answer_text) if len(s.strip()) > 10]
            extracted_claims = sentences

        evaluated_claims = []
        for claim in extracted_claims:
            val_res = validate_claim(claim, candidate_profile)
            evaluated_claims.append(val_res)
            all_claims.append(val_res)
            if not val_res["is_valid"]:
                unsupported_count += 1
                if val_res.get("violation_code") == "RULE_VIOLATION_SKILL_TO_EXPERIENCE":
                    has_critical_violations = True
                    missing_information.append(
                        f"Missing verified project/work experience proof for experiential claim on {val_res['matched_skills']}"
                    )

        # Check for answer completeness
        if len(answer_text.strip()) < 40:
            missing_information.append(f"Answer for Question '{q_text[:30]}...' is incomplete or too short.")

        validated_answers.append({
            "question_id": q_id,
            "question_text": q_text,
            "answer_text": answer_text,
            "claims": evaluated_claims
        })

    # Deduplicate missing information
    missing_information = list(dict.fromkeys(missing_information))

    # Determine recommended system state
    if has_critical_violations or len(missing_information) > 2:
        recommended_system_state = "Needs input"
    elif unsupported_count > 0:
        recommended_system_state = "Needs input"
    else:
        recommended_system_state = "Awaiting approval"

    return {
        "validated_answers": validated_answers,
        "all_claims": all_claims,
        "missing_information": missing_information,
        "has_critical_violations": has_critical_violations,
        "total_claims": len(all_claims),
        "supported_claims": len([c for c in all_claims if c["is_valid"]]),
        "unsupported_claims": unsupported_count,
        "recommended_system_state": recommended_system_state
    }
