"""LangChain chain that picks a student's strongest experiences for a posting.

Reads every experience the student has saved, hands them to Claude along with
the job description, and gets back only the ones worth putting on this resume,
ranked, rewritten as bullets.
"""

import os
from datetime import datetime, timezone

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# Haiku 4.5 is the cheapest current model: $1/$5 per million tokens in/out.
# A run here is roughly 2K in / 600 out, so well under a cent. Override with
# ANTHROPIC_MODEL in api/.env if you ever want to spend more for quality.
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5")

DEFAULT_MAX_EXPERIENCES = 4

# The rule that matters most. Rewriting how work is described is the job;
# inventing work is resume fraud, and a student would be taking that into an
# interview. It is stated as a hard constraint and repeated in the user turn.
SYSTEM_PROMPT = """You choose which of a student's experiences belong on a resume \
for one specific job, and write the bullets for the ones you pick. You are \
helping a member of IEEE-CS at USF.

Selecting is the main job. A resume is short. Pick only the experiences that \
genuinely strengthen this application, ordered strongest first, and leave the \
rest out. Do not fill the list to the limit - if only two experiences really \
fit the posting, return two. Judge on how well the work matches what the \
posting asks for, not on how impressive the title sounds.

For each one you pick, write bullets from what the student actually wrote. You may:
- reframe their wording to match the language of the posting
- lead with the part of the work the posting cares about
- tighten phrasing into strong resume bullets, each starting with a past-tense
  verb (present tense for a role they still hold)

You must never:
- invent metrics, numbers, percentages, team sizes, or outcomes they did not state
- add technologies, tools, or responsibilities they did not mention
- claim seniority, ownership, or impact beyond what their description supports
- select an experience that is not in the list you were given

Write 2-4 bullets each. No trailing periods. No first-person pronouns."""

USER_PROMPT = """Here is the job description:

<job_description>
{job_description}
</job_description>

Here is everything the student has saved:

<experiences>
{experiences}
</experiences>

Pick at most {max_experiences} of these - fewer if fewer genuinely fit - ranked \
strongest first for this posting. Copy each experienceId exactly as given. For \
each, say in one short line why it earns a place on this particular resume, then \
write the bullets. Work only from what the student wrote. Invent nothing."""


class SelectedExperience(BaseModel):
    """One experience worth putting on this resume."""

    experienceId: str = Field(description="The id of the experience, copied exactly")
    role: str = Field(description="The student's role, copied exactly")
    company: str = Field(description="The organization, copied exactly")
    whyChosen: str = Field(
        description="One short line on why this earns a place on this resume"
    )
    bullets: list[str] = Field(description="2-4 resume bullets tailored to the posting")


class TailoredResume(BaseModel):
    """The experiences chosen for one posting, strongest first."""

    selected: list[SelectedExperience]


def _format_experiences(records: list[dict]) -> str:
    """Render the experiences as a block the model can read cleanly."""
    blocks = []
    for r in records:
        dates = f"{r['start_date']} to {'present' if r['current'] else r['end_date']}"
        blocks.append(
            f"<experience id=\"{r['id']}\">\n"
            f"Role: {r['role']}\n"
            f"Organization: {r['company']}\n"
            f"Location: {r['location'] or 'not given'}\n"
            f"Dates: {dates}\n"
            f"What they wrote: {r['description'] or 'no description given'}\n"
            f"</experience>"
        )
    return "\n\n".join(blocks)


def build_chain():
    """Wire the prompt to Claude with the output schema enforced.

    Built per request rather than at import time so a missing API key surfaces
    as a handled error on the endpoint, not a crash on startup.
    """
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to api/.env or export it "
            "before starting the API."
        )

    # The output is a few bullets per experience — 4000 is generous. This is
    # a ceiling, not a spend: billing is on tokens actually produced.
    model = ChatAnthropic(model=MODEL, max_tokens=4000)
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", USER_PROMPT)]
    )
    # with_structured_output binds the schema as a tool, so the shape is
    # enforced by the API rather than by parsing whatever prose comes back.
    return prompt | model.with_structured_output(TailoredResume)


def tailor(
    job_description: str,
    records: list[dict],
    max_experiences: int = DEFAULT_MAX_EXPERIENCES,
) -> dict:
    """Run the chain and return the payload the frontend shows and downloads."""
    chain = build_chain()
    result: TailoredResume = chain.invoke(
        {
            "job_description": job_description,
            "experiences": _format_experiences(records),
            "max_experiences": max_experiences,
        }
    )

    # Keep only picks that name a real experience. A model can return an id
    # that does not exist; the student should never be shown an experience
    # they did not save.
    by_id = {str(r["id"]): r for r in records}
    selected = [s for s in result.selected if s.experienceId in by_id][:max_experiences]

    # What was left out is a set difference, not something the model reports —
    # deterministic, free, and impossible to hallucinate.
    chosen_ids = {s.experienceId for s in selected}
    not_selected = [
        {"experienceId": str(r["id"]), "role": r["role"], "company": r["company"]}
        for r in records
        if str(r["id"]) not in chosen_ids
    ]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "consideredCount": len(records),
        "selected": [s.model_dump() for s in selected],
        "notSelected": not_selected,
    }
