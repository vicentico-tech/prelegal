from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.chat import MndaChatTurn, NdaFieldsPartial, NdaFieldsSnapshot, PartyInfo, _build_system_prompt
from app.llm import LlmUnavailableError
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@patch("app.chat.call_structured")
def test_chat_turn_returns_reply_and_fields(mock_call_structured, client):
    mock_call_structured.return_value = MndaChatTurn(
        reply="Great, what's Party 1's legal name?",
        fields=NdaFieldsPartial(purpose="evaluating a partnership"),
    )

    response = client.post(
        "/api/chat/mnda",
        json={"messages": [{"role": "user", "content": "We want to discuss a partnership"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Great, what's Party 1's legal name?"
    assert body["fields"]["purpose"] == "evaluating a partnership"
    assert body["fields"]["partyA"] is None


@patch("app.chat.call_structured")
def test_current_fields_reach_the_system_prompt(mock_call_structured, client):
    mock_call_structured.return_value = MndaChatTurn(reply="ok")

    client.post(
        "/api/chat/mnda",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "currentFields": {"purpose": "evaluating a partnership"},
        },
    )

    sent_messages = mock_call_structured.call_args.args[0]
    assert "evaluating a partnership" in sent_messages[0]["content"]
    assert sent_messages[0]["role"] == "system"
    assert sent_messages[-1] == {"role": "user", "content": "hi"}


def test_system_prompt_omits_fields_not_yet_collected():
    fields = NdaFieldsSnapshot(purpose="evaluating a partnership", party_a=PartyInfo(legal_name="Acme Inc"))

    prompt = _build_system_prompt(fields)

    assert '"purpose": "evaluating a partnership"' in prompt
    assert '"legalName": "Acme Inc"' in prompt
    # Unset fields must not show up as empty-string noise in the "known fields" JSON.
    assert '""' not in prompt
    assert '"governingLaw": ""' not in prompt


def test_system_prompt_known_fields_is_empty_object_when_nothing_collected():
    prompt = _build_system_prompt(NdaFieldsSnapshot())

    assert "{}" in prompt
    assert '""' not in prompt


@patch("app.chat.call_structured")
def test_llm_unavailable_returns_503(mock_call_structured, client):
    mock_call_structured.side_effect = LlmUnavailableError("both models down")

    response = client.post("/api/chat/mnda", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 503
