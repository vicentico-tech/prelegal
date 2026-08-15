import json
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.llm import LlmUnavailableError, call_structured

router = APIRouter(prefix="/api/chat", tags=["chat"])


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PartyInfo(_CamelModel):
    legal_name: str = ""
    address: str = ""
    signatory_name: str = ""
    signatory_title: str = ""
    signature_date: str = ""


class NdaFieldsSnapshot(_CamelModel):
    party_a: PartyInfo = Field(default_factory=PartyInfo)
    party_b: PartyInfo = Field(default_factory=PartyInfo)
    effective_date: str = ""
    purpose: str = ""
    mnda_term: str = ""
    term_of_confidentiality: str = ""
    governing_law: str = ""
    jurisdiction: str = ""


class PartyFieldsPartial(_CamelModel):
    legal_name: str | None = None
    address: str | None = None
    signatory_name: str | None = None
    signatory_title: str | None = None
    signature_date: str | None = None


class NdaFieldsPartial(_CamelModel):
    party_a: PartyFieldsPartial | None = None
    party_b: PartyFieldsPartial | None = None
    effective_date: str | None = None
    purpose: str | None = None
    mnda_term: str | None = None
    term_of_confidentiality: str | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(_CamelModel):
    messages: list[ChatMessage]
    current_fields: NdaFieldsSnapshot = Field(default_factory=NdaFieldsSnapshot)


class MndaChatTurn(_CamelModel):
    reply: str
    fields: NdaFieldsPartial = Field(default_factory=NdaFieldsPartial)


# (dotted key, human-readable description) for every leaf field on NdaFieldsSnapshot.
# Single source of truth for the prompt text so it can't drift from the schema above.
_FIELD_GUIDE = [
    ("partyA.legalName", "Party 1's legal name"),
    ("partyA.address", "Party 1's address"),
    ("partyA.signatoryName", "Name of the person signing for Party 1"),
    ("partyA.signatoryTitle", "Title of the person signing for Party 1"),
    ("partyA.signatureDate", "Date Party 1 signs"),
    ("partyB.legalName", "Party 2's legal name"),
    ("partyB.address", "Party 2's address"),
    ("partyB.signatoryName", "Name of the person signing for Party 2"),
    ("partyB.signatoryTitle", "Title of the person signing for Party 2"),
    ("partyB.signatureDate", "Date Party 2 signs"),
    (
        "purpose",
        "Purpose of the disclosure, phrased as a short noun phrase (e.g. 'evaluating a potential "
        "business relationship'), since it gets spliced into a sentence like 'in connection with the ...'",
    ),
    ("effectiveDate", "Effective date of the agreement"),
    ("mndaTerm", "MNDA term (how long the agreement itself lasts)"),
    ("termOfConfidentiality", "Term of confidentiality (how long confidentiality obligations survive after termination)"),
    ("governingLaw", "Governing law (state whose laws govern the agreement)"),
    ("jurisdiction", "Jurisdiction (where legal disputes must be brought)"),
]


def _prune_empty(value: object) -> object:
    """Recursively drop empty strings/dicts so only actually-collected fields remain."""
    if isinstance(value, dict):
        pruned = {key: _prune_empty(item) for key, item in value.items()}
        return {key: item for key, item in pruned.items() if item not in ("", {})}
    return value


def _build_system_prompt(current_fields: NdaFieldsSnapshot) -> str:
    field_guide_text = "\n".join(f"- {key}: {description}" for key, description in _FIELD_GUIDE)
    known_fields = _prune_empty(current_fields.model_dump(by_alias=True))
    known_fields_text = json.dumps(known_fields) if known_fields else "{}"

    return (
        "You are a legal document assistant helping a user fill in a Mutual Non-Disclosure "
        "Agreement (Mutual NDA). This is currently the only document type you can help draft, even "
        "though other document types may come up in conversation - if the user asks for something "
        "else, say you can only help with a Mutual NDA right now and offer to continue with that.\n\n"
        "Have a natural conversation to collect the following fields. Ask about a few related fields "
        "at a time rather than all at once, and don't re-ask about fields already known.\n\n"
        f"Fields:\n{field_guide_text}\n\n"
        f"Fields already known (do not ask about these again unless the user wants to change them):\n"
        f"{known_fields_text}\n\n"
        "Respond with a structured object containing:\n"
        "- reply: your conversational reply to the user (plain text)\n"
        "- fields: only the fields the user just gave you or confirmed in THIS turn - leave every "
        "other field null. Never invent or guess a value the user did not state."
    )


@router.post("/mnda", response_model=MndaChatTurn)
def mnda_chat_turn(request: ChatRequest) -> MndaChatTurn:
    system_prompt = _build_system_prompt(request.current_fields)
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(message.model_dump() for message in request.messages)

    try:
        return call_structured(messages, MndaChatTurn)
    except LlmUnavailableError as error:
        raise HTTPException(
            status_code=503, detail="The AI assistant is temporarily unavailable. Please try again."
        ) from error
