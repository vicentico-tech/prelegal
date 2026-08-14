from unittest.mock import MagicMock, patch

import pytest
from pydantic import BaseModel

from app.llm import FALLBACK_MODEL, PRIMARY_MODEL, LlmUnavailableError, call_structured


class _Echo(BaseModel):
    text: str


def _completion_response(content: str) -> MagicMock:
    response = MagicMock()
    response.choices = [MagicMock(message=MagicMock(content=content))]
    return response


@patch("app.llm.litellm.completion")
def test_call_structured_returns_parsed_response_on_primary_success(mock_completion):
    mock_completion.return_value = _completion_response('{"text": "hi"}')

    result = call_structured([{"role": "user", "content": "hi"}], _Echo)

    assert result == _Echo(text="hi")
    mock_completion.assert_called_once()
    assert mock_completion.call_args.kwargs["model"] == PRIMARY_MODEL


@patch("app.llm.litellm.completion")
def test_call_structured_falls_back_to_second_model_on_primary_failure(mock_completion):
    mock_completion.side_effect = [RuntimeError("primary down"), _completion_response('{"text": "ok"}')]

    result = call_structured([{"role": "user", "content": "hi"}], _Echo)

    assert result == _Echo(text="ok")
    assert mock_completion.call_count == 2
    assert mock_completion.call_args.kwargs["model"] == FALLBACK_MODEL


@patch("app.llm.litellm.completion")
def test_call_structured_raises_when_both_models_fail(mock_completion):
    mock_completion.side_effect = RuntimeError("down")

    with pytest.raises(LlmUnavailableError):
        call_structured([{"role": "user", "content": "hi"}], _Echo)

    assert mock_completion.call_count == 2
