import os
import logging
import base64
from typing import List, Dict, Optional
from pathlib import Path

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

logger = logging.getLogger(__name__)

# ── Provider detection ──────────────────────────────────────────────────
# Set AI_PROVIDER=gemini or AI_PROVIDER=openai in .env (default: auto-detect)

_provider = os.getenv("AI_PROVIDER", "").lower()

if _provider == "gemini":
    AI_PROVIDER = "gemini"
elif _provider == "openai":
    AI_PROVIDER = "openai"
elif os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"):
    AI_PROVIDER = "gemini"
elif os.getenv("OPENAI_API_KEY"):
    AI_PROVIDER = "openai"
else:
    AI_PROVIDER = "gemini"  # default

logger.info(f"AI provider: {AI_PROVIDER}")

# Lazy imports based on provider
genai = None
OpenAI = None

if AI_PROVIDER == "gemini":
    import google.generativeai as genai  # noqa: F811
elif AI_PROVIDER == "openai":
    from openai import OpenAI  # noqa: F811


# ── Persona definitions ────────────────────────────────────────────────

PERSONAS = {
    "academic": {
        "label": "Academic Mentor",
        "system": (
            "You are FileGeek — a brilliant academic mentor who helps students deeply "
            "understand their documents.\n"
            "- Encouraging yet precise: celebrate good questions, never give vague answers\n"
            "- Structured and clear: always use Markdown (headers, lists, bold, code blocks)\n"
            "- Adaptive depth: concise for quick lookups; thorough with examples for concepts\n"
            "- Render math/logic in LaTeX ($E = mc^2$, $\\neg$, $\\iff$)\n"
            "- Simplify with real-world analogies when confusion is sensed\n"
            "- Never fabricate — if info is absent from context, say so\n"
            "- Use conversation history to gauge understanding and adapt"
        ),
        "greeting": "Hello! I'm your Academic Mentor. Upload a document and let's explore it together.",
        "voice": "alloy",
    },
    "professional": {
        "label": "Professional Analyst",
        "system": (
            "You are FileGeek — a professional document analyst.\n"
            "- Direct and efficient: get to the point\n"
            "- Use structured Markdown (headers, bullets, tables)\n"
            "- Focus on actionable insights and key takeaways\n"
            "- Formal, business-appropriate language\n"
            "- Highlight risks, opportunities, and recommendations\n"
            "- Never fabricate — say so if info is missing\n"
            "- Executive-summary style when appropriate"
        ),
        "greeting": "Good day. I'm ready to analyze your documents with precision. Upload a file to begin.",
        "voice": "onyx",
    },
    "casual": {
        "label": "Casual Helper",
        "system": (
            "You are FileGeek — a friendly and approachable document helper.\n"
            "- Conversational and easy-going, like explaining to a friend\n"
            "- Simple language, avoid jargon\n"
            "- Helpful analogies and relatable examples\n"
            "- Encouraging and supportive\n"
            "- Never fabricate — say so if info is missing\n"
            "- Keep it concise unless asked for more"
        ),
        "greeting": "Hey there! Drop a file and ask me anything — I'll keep it simple.",
        "voice": "shimmer",
    },
    "einstein": {
        "label": "Albert Einstein",
        "system": (
            "You are FileGeek channeling the spirit of Albert Einstein.\n"
            "- Professorial tone, slightly humorous, intellectually playful\n"
            "- Frequently use physics metaphors and thought experiments\n"
            '- Occasionally quote yourself: "Imagination is more important than knowledge."\n'
            "- Explain complex ideas by relating them to space, time, and relativity\n"
            "- Use LaTeX for any equations ($E = mc^2$, $F = ma$)\n"
            "- Be warm and encouraging — knowledge should be a joyful pursuit\n"
            "- Never fabricate — if info is absent, say so with a wry smile"
        ),
        "greeting": "Ah, willkommen! As I always say, the important thing is not to stop questioning. Show me your document!",
        "voice": "echo",
    },
    "genz_tutor": {
        "label": "Gen-Z Tutor",
        "system": (
            "You are FileGeek as a Gen-Z tutor — energetic, relatable, and modern.\n"
            "- Use casual Gen-Z language naturally (no cap, lowkey, vibe, slay, etc.)\n"
            "- Explain things with pop-culture references and memes\n"
            "- Use emojis moderately to keep things engaging\n"
            "- Break down hard concepts into bite-sized, TikTok-worthy explanations\n"
            "- Be hype and encouraging — learning should be fire\n"
            "- Still accurate — never fabricate info\n"
            "- Use Markdown for structure but keep it fun"
        ),
        "greeting": "yooo welcome to FileGeek!! drop ur file and let's get this bread fr fr",
        "voice": "nova",
    },
    "sherlock": {
        "label": "Sherlock Holmes",
        "system": (
            "You are FileGeek channeling Sherlock Holmes — the world's greatest consulting detective.\n"
            "- Analytical, deductive, and precise in reasoning\n"
            "- Approach every document as a case to be solved\n"
            "- Use deductive reasoning chains: 'observe -> deduce -> conclude'\n"
            '- Occasionally reference Baker Street and Watson\n'
            "- Dry British wit; slightly condescending but never unkind\n"
            "- Never fabricate — when data is insufficient, say 'insufficient data for a conclusion'\n"
            "- Use Markdown for structured deductions"
        ),
        "greeting": "The game is afoot! Present your document, and I shall deduce its every secret.",
        "voice": "fable",
    },
    "socratic": {
        "label": "Socratic Guide",
        "system": (
            "You are FileGeek in Socratic mode — a guide who never gives direct answers.\n"
            "- NEVER state facts directly; always respond with a clarifying or probing question\n"
            "- Lead the user to discover the answer themselves through a chain of questions\n"
            "- Example: if asked 'What is mitosis?', respond with 'What do you already know about how cells reproduce?'\n"
            "- After 3-4 exchanges on the same concept, offer a brief confirming statement\n"
            "- Keep questions short, focused, and grounded in the uploaded document\n"
            "- Use Markdown sparingly — conversations should feel like dialogue, not lectures\n"
            "- Never fabricate — if info is absent from context, ask the user what they think instead\n"
            "- Warmly celebrate when the user arrives at the correct answer"
        ),
        "greeting": "Welcome! Instead of telling you the answers, I'll help you find them yourself. What question are you wrestling with today?",
        "voice": "alloy",
    },
}

FILE_TYPE_MODIFIERS = {
    "pdf": "\nThe document is a PDF. Pay attention to page references and structure.",
    "docx": "\nThe document is a Word file. Focus on textual content and formatting.",
    "txt": "\nThe document is a plain text file. Focus on the raw content.",
    "image": (
        "\nThe content includes an image. You can see it directly. Describe what you "
        "observe and answer the user's question based on the visual content."
    ),
}


class PersonaManager:
    """Central registry for persona definitions."""

    @staticmethod
    def get(name: str) -> dict:
        return PERSONAS.get(name, PERSONAS["academic"])

    @staticmethod
    def list_all() -> list:
        return [
            {"id": k, "label": v["label"], "greeting": v["greeting"]}
            for k, v in PERSONAS.items()
        ]

    @staticmethod
    def system_prompt(persona: str = "academic", file_type: str = "pdf") -> str:
        p = PERSONAS.get(persona, PERSONAS["academic"])
        modifier = FILE_TYPE_MODIFIERS.get(file_type, "")
        return p["system"] + modifier

    @staticmethod
    def voice_for(persona: str) -> str:
        return PERSONAS.get(persona, PERSONAS["academic"]).get("voice", "alloy")


def get_persona_prompt(persona: str = "academic", file_type: str = "pdf") -> str:
    """Backward-compatible helper."""
    return PersonaManager.system_prompt(persona, file_type)


# ── AI Service (dual-provider: Gemini + OpenAI) ────────────────────────

class AIService:
    # Gemini models
    GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.0-flash")
    GEMINI_RESPONSE_MODEL = os.getenv("GEMINI_RESPONSE_MODEL", "gemini-2.0-flash")
    GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")

    # OpenAI models
    OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o")
    OPENAI_RESPONSE_MODEL = os.getenv("OPENAI_RESPONSE_MODEL", "gpt-4o")
    OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    # Backward-compatible aliases
    CHAT_MODEL = GEMINI_CHAT_MODEL if AI_PROVIDER == "gemini" else OPENAI_CHAT_MODEL
    RESPONSE_MODEL = GEMINI_RESPONSE_MODEL if AI_PROVIDER == "gemini" else OPENAI_RESPONSE_MODEL

    def __init__(self):
        self.provider = AI_PROVIDER
        self._openai_client = None

        if self.provider == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY (or GEMINI_API_KEY) environment variable is required")
            genai.configure(api_key=api_key)
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=self.GEMINI_EMBEDDING_MODEL,
                google_api_key=api_key,
            )
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
            self._openai_client = OpenAI(api_key=api_key)
            self.embeddings = OpenAIEmbeddings(
                model=self.OPENAI_EMBEDDING_MODEL,
                openai_api_key=api_key,
            )

    @property
    def client(self):
        """Backward compat: returns OpenAI client for TTS etc."""
        if self._openai_client is None and os.getenv("OPENAI_API_KEY"):
            from openai import OpenAI as _OpenAI
            self._openai_client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        return self._openai_client

    # ── Answer from context ─────────────────────────────────────────────
    def answer_from_context(
        self,
        context_chunks: List[str],
        question: str,
        chat_history: List[Dict],
        model_override: str = None,
        persona: str = "academic",
        file_type: str = "pdf",
        image_paths: Optional[List[str]] = None,
    ) -> Optional[str]:
        if self.provider == "gemini":
            return self._answer_gemini(
                context_chunks, question, chat_history,
                model_override, persona, file_type, image_paths,
            )
        else:
            return self._answer_openai(
                context_chunks, question, chat_history,
                model_override, persona, file_type, image_paths,
            )

    # ── Gemini implementation ───────────────────────────────────────────
    def _answer_gemini(
        self,
        context_chunks: List[str],
        question: str,
        chat_history: List[Dict],
        model_override: str = None,
        persona: str = "academic",
        file_type: str = "pdf",
        image_paths: Optional[List[str]] = None,
    ) -> Optional[str]:
        try:
            if not question.strip():
                logger.error("Empty question provided")
                return None

            context = "\n\n---\n\n".join(context_chunks) if context_chunks else ""
            system_instruction = PersonaManager.system_prompt(persona, file_type)
            if model_override:
                system_instruction += "\n\nThink step by step. Be thorough, exhaustive, and analytical."

            model_name = model_override or self.GEMINI_CHAT_MODEL
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
            )

            contents = []

            # Chat history
            if chat_history:
                for entry in chat_history:
                    role = entry.get("role")
                    content = entry.get("content", "")
                    if role == "user":
                        contents.append({"role": "user", "parts": [content]})
                    elif role == "assistant":
                        contents.append({"role": "model", "parts": [content]})

            # User turn with context + images
            user_parts = []
            if context:
                user_parts.append(
                    f"Context from the document:\n\n{context}\n\n---\n\nQuestion: {question}"
                )
            else:
                user_parts.append(question)

            # Multi-modal: attach images directly
            if image_paths:
                for img_path in image_paths:
                    try:
                        img_data = Path(img_path).read_bytes()
                        ext = Path(img_path).suffix.lower()
                        mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(ext, "image/png")
                        user_parts.append({
                            "inline_data": {
                                "mime_type": mime,
                                "data": base64.b64encode(img_data).decode("utf-8"),
                            }
                        })
                    except Exception as e:
                        logger.warning(f"Could not attach image {img_path}: {e}")

            contents.append({"role": "user", "parts": user_parts})
            response = model.generate_content(contents)
            answer = response.text
            logger.info(f"Gemini answered ({len(context_chunks)} chunks, model={model_name}, images={len(image_paths or [])})")
            return answer

        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return None

    # ── OpenAI implementation ───────────────────────────────────────────
    def _answer_openai(
        self,
        context_chunks: List[str],
        question: str,
        chat_history: List[Dict],
        model_override: str = None,
        persona: str = "academic",
        file_type: str = "pdf",
        image_paths: Optional[List[str]] = None,
    ) -> Optional[str]:
        try:
            if not question.strip():
                logger.error("Empty question provided")
                return None

            context = "\n\n---\n\n".join(context_chunks) if context_chunks else ""
            system_content = PersonaManager.system_prompt(persona, file_type)
            if model_override:
                system_content += "\n\nThink step by step. Be thorough, exhaustive, and analytical."

            messages = [{"role": "system", "content": system_content}]

            # Chat history
            if chat_history:
                for entry in chat_history:
                    if entry.get("role") in ("user", "assistant") and entry.get("content"):
                        messages.append({"role": entry["role"], "content": entry["content"]})

            # Build user message with optional vision
            user_content = []
            text_part = f"Context from the document:\n\n{context}\n\n---\n\nQuestion: {question}" if context else question

            if image_paths:
                # Use vision-capable format
                user_content.append({"type": "text", "text": text_part})
                for img_path in image_paths:
                    try:
                        img_data = Path(img_path).read_bytes()
                        ext = Path(img_path).suffix.lower()
                        mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(ext, "image/png")
                        b64 = base64.b64encode(img_data).decode("utf-8")
                        user_content.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{b64}"},
                        })
                    except Exception as e:
                        logger.warning(f"Could not attach image {img_path}: {e}")
                messages.append({"role": "user", "content": user_content})
            else:
                messages.append({"role": "user", "content": text_part})

            model = model_override or self.OPENAI_CHAT_MODEL
            response = self._openai_client.chat.completions.create(
                model=model,
                messages=messages,
            )
            answer = response.choices[0].message.content
            logger.info(f"OpenAI answered ({len(context_chunks)} chunks, model={model})")
            return answer

        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return None

    # ── Agentic answer with tool calling ──────────────────────────────
    def answer_with_tools(
        self,
        question: str,
        chat_history: List[Dict],
        tool_executor,
        session_id: str,
        user_id: int,
        persona: str = "academic",
        file_type: str = "pdf",
        model_override: str = None,
        memory_context: str = "",
        preference_context: str = "",
    ) -> Dict:
        """Agentic loop: send message, handle tool calls, return final answer + artifacts."""
        if self.provider == "gemini":
            return self._agentic_gemini(
                question, chat_history, tool_executor, session_id, user_id,
                persona, file_type, model_override, memory_context, preference_context,
            )
        else:
            return self._agentic_openai(
                question, chat_history, tool_executor, session_id, user_id,
                persona, file_type, model_override, memory_context, preference_context,
            )

    def _agentic_openai(
        self, question, chat_history, tool_executor, session_id, user_id,
        persona, file_type, model_override, memory_context, preference_context,
    ) -> Dict:
        from services.tools import TOOL_DEFINITIONS
        import json

        system_content = PersonaManager.system_prompt(persona, file_type)
        if memory_context:
            system_content += f"\n\nBased on past sessions: {memory_context}"
        if preference_context:
            system_content += f"\n\nUser preferences: {preference_context}"
        system_content += (
            "\n\nYou have tools available. Use search_documents to find information from uploaded documents. "
            "Use generate_quiz when the user asks for a quiz or multiple-choice questions. "
            "Use generate_flashcards when the user asks for flashcards, flash cards, or spaced repetition study cards. "
            "Use create_study_guide when the user asks for a study guide or outline. "
            "Use generate_visualization when the user asks for a diagram or visualization. "
            "If you cannot find information, state what's missing and suggest 2-3 alternative questions "
            "in this format: ```suggestions\n[{\"text\": \"...\", \"reason\": \"...\"}]\n```"
        )
        if model_override:
            system_content += "\n\nThink step by step. Be thorough, exhaustive, and analytical."

        messages = [{"role": "system", "content": system_content}]
        for entry in (chat_history or []):
            if entry.get("role") in ("user", "assistant") and entry.get("content"):
                messages.append({"role": entry["role"], "content": entry["content"]})
        messages.append({"role": "user", "content": question})

        model = model_override or self.OPENAI_CHAT_MODEL
        artifacts = []
        tool_calls_log = []
        max_rounds = 3

        for _round in range(max_rounds):
            try:
                response = self._openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                )
            except Exception as e:
                logger.error(f"OpenAI agentic call failed: {e}")
                return {"answer": "I encountered an error processing your request.", "sources": [], "artifacts": [], "suggestions": []}

            choice = response.choices[0]

            if choice.finish_reason == "tool_calls" or (choice.message.tool_calls and len(choice.message.tool_calls) > 0):
                messages.append(choice.message)

                for tc in choice.message.tool_calls:
                    fn_name = tc.function.name
                    try:
                        fn_args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        fn_args = {}

                    result = tool_executor.execute(fn_name, fn_args, session_id, user_id)
                    tool_calls_log.append({"tool": fn_name, "args": fn_args, "result_keys": list(result.keys())})

                    if result.get("artifact_type"):
                        artifacts.append(result)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result),
                    })
            else:
                answer = choice.message.content or ""
                sources, suggestions = self._parse_response_extras(answer, tool_calls_log)
                return {
                    "answer": answer,
                    "sources": sources,
                    "artifacts": artifacts,
                    "suggestions": suggestions,
                    "tool_calls": tool_calls_log,
                }

        # Max rounds reached — get final response
        try:
            response = self._openai_client.chat.completions.create(
                model=model,
                messages=messages,
            )
            answer = response.choices[0].message.content or ""
        except Exception:
            answer = "I reached the maximum processing steps. Here's what I found so far."

        sources, suggestions = self._parse_response_extras(answer, tool_calls_log)
        return {
            "answer": answer,
            "sources": sources,
            "artifacts": artifacts,
            "suggestions": suggestions,
            "tool_calls": tool_calls_log,
        }

    def _agentic_gemini(
        self, question, chat_history, tool_executor, session_id, user_id,
        persona, file_type, model_override, memory_context, preference_context,
    ) -> Dict:
        from services.tools import GEMINI_TOOL_DEFINITIONS
        import json

        system_instruction = PersonaManager.system_prompt(persona, file_type)
        if memory_context:
            system_instruction += f"\n\nBased on past sessions: {memory_context}"
        if preference_context:
            system_instruction += f"\n\nUser preferences: {preference_context}"
        system_instruction += (
            "\n\nYou have tools available. Use search_documents to find information from uploaded documents. "
            "Use generate_quiz when the user asks for a quiz or multiple-choice questions. "
            "Use generate_flashcards when the user asks for flashcards, flash cards, or spaced repetition study cards. "
            "Use create_study_guide when the user asks for a study guide or outline. "
            "Use generate_visualization when the user asks for a diagram or visualization. "
            "If you cannot find information, state what's missing and suggest 2-3 alternative questions "
            "in this format: ```suggestions\n[{\"text\": \"...\", \"reason\": \"...\"}]\n```"
        )
        if model_override:
            system_instruction += "\n\nThink step by step. Be thorough, exhaustive, and analytical."

        model_name = model_override or self.GEMINI_CHAT_MODEL
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction,
            tools=[{"function_declarations": GEMINI_TOOL_DEFINITIONS}],
        )

        contents = []
        for entry in (chat_history or []):
            role = entry.get("role")
            content = entry.get("content", "")
            if role == "user":
                contents.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [content]})
        contents.append({"role": "user", "parts": [question]})

        artifacts = []
        tool_calls_log = []
        max_rounds = 3

        for _round in range(max_rounds):
            try:
                response = model.generate_content(contents)
            except Exception as e:
                logger.error(f"Gemini agentic call failed: {e}")
                return {"answer": "I encountered an error processing your request.", "sources": [], "artifacts": [], "suggestions": []}

            # Check for function calls
            candidate = response.candidates[0] if response.candidates else None
            if not candidate:
                return {"answer": "No response generated.", "sources": [], "artifacts": [], "suggestions": []}

            has_function_call = False
            function_responses = []

            for part in candidate.content.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    has_function_call = True
                    fn_name = part.function_call.name
                    fn_args = dict(part.function_call.args) if part.function_call.args else {}

                    result = tool_executor.execute(fn_name, fn_args, session_id, user_id)
                    tool_calls_log.append({"tool": fn_name, "args": fn_args, "result_keys": list(result.keys())})

                    if result.get("artifact_type"):
                        artifacts.append(result)

                    function_responses.append({
                        "function_response": {
                            "name": fn_name,
                            "response": result,
                        }
                    })

            if has_function_call:
                contents.append(candidate.content)
                contents.append({"role": "user", "parts": function_responses})
            else:
                answer = response.text or ""
                sources, suggestions = self._parse_response_extras(answer, tool_calls_log)
                return {
                    "answer": answer,
                    "sources": sources,
                    "artifacts": artifacts,
                    "suggestions": suggestions,
                    "tool_calls": tool_calls_log,
                }

        # Max rounds — get final text
        try:
            response = model.generate_content(contents)
            answer = response.text or ""
        except Exception:
            answer = "I reached the maximum processing steps."

        sources, suggestions = self._parse_response_extras(answer, tool_calls_log)
        return {
            "answer": answer,
            "sources": sources,
            "artifacts": artifacts,
            "suggestions": suggestions,
            "tool_calls": tool_calls_log,
        }

    def _parse_response_extras(self, answer: str, tool_calls_log: list) -> tuple:
        """Extract sources from search_documents calls and suggestions from response."""
        import json
        import re

        sources = []
        for tc in tool_calls_log:
            if tc["tool"] == "search_documents" and "results" in tc.get("result_keys", []):
                pass  # Sources come from tool results embedded in the answer

        suggestions = []
        suggestion_match = re.search(r'```suggestions\s*\n(.*?)\n```', answer, re.DOTALL)
        if suggestion_match:
            try:
                suggestions = json.loads(suggestion_match.group(1))
            except json.JSONDecodeError:
                pass

        return sources, suggestions

    # ── Embeddings ──────────────────────────────────────────────────────
    def get_embeddings(self, text_list: List[str]) -> List[List[float]]:
        if not text_list:
            return []
        return self.embeddings.embed_documents(text_list)

    # ── File validation ─────────────────────────────────────────────────
    def validate_file(self, filepath: str) -> bool:
        try:
            if not os.path.exists(filepath):
                return False
            if os.path.getsize(filepath) > 10 * 1024 * 1024:
                return False
            allowed = (".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg")
            if not filepath.lower().endswith(allowed):
                return False
            return True
        except Exception as e:
            logger.error(f"File validation error: {e}")
            return False
