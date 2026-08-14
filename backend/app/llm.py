import os

import litellm
from pydantic import BaseModel

PRIMARY_MODEL = "openrouter/openai/gpt-oss-20b:free"
FALLBACK_MODEL = "openrouter/nvidia/nemotron-nano-9b-v2:free"

_APP_URL = "https://github.com/vicentico-tech/prelegal"
_APP_TITLE = "Prelegal"


class LlmUnavailableError(RuntimeError):
    """Raised when no configured OpenRouter model could produce a response."""


def call_structured[T: BaseModel](messages: list[dict], response_model: type[T]) -> T:
    """Call an OpenRouter free model with Structured Outputs, falling back once.

    Tries PRIMARY_MODEL, then FALLBACK_MODEL, returning the first successfully
    parsed response. Raises LlmUnavailableError if both fail.
    """
    last_error: Exception | None = None
    for model in (PRIMARY_MODEL, FALLBACK_MODEL):
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                response_format=response_model,
                api_key=os.environ.get("OPENROUTER_API_KEY"),
                extra_headers={"HTTP-Referer": _APP_URL, "X-Title": _APP_TITLE},
                timeout=30,
            )
            content = response.choices[0].message.content
            return response_model.model_validate_json(content)
        except Exception as error:  # noqa: BLE001 - any provider/network failure should trigger fallback
            last_error = error

    raise LlmUnavailableError(f"All OpenRouter models failed: {last_error}") from last_error
