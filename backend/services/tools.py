import json
import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Tool definitions in OpenAI function-calling format
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Search the user's uploaded documents for information relevant to a query. Use this to find specific facts, passages, or data from the documents.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant document passages",
                    },
                    "n_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 5, max 12)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_quiz",
            "description": "Generate a quiz with multiple-choice questions based on document content. Returns a structured quiz artifact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or section to generate quiz questions about",
                    },
                    "num_questions": {
                        "type": "integer",
                        "description": "Number of questions to generate (default 5)",
                        "default": 5,
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_study_guide",
            "description": "Create a structured study guide from the document content. Returns a study guide artifact with sections, key points, and review questions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or focus area for the study guide",
                    },
                    "depth": {
                        "type": "string",
                        "enum": ["brief", "standard", "comprehensive"],
                        "description": "Level of detail (default: standard)",
                        "default": "standard",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_visualization",
            "description": "Generate a visual representation of concepts. Supports Mermaid diagrams, tables, and structured data. Returns a visualization artifact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "What to visualize (e.g., 'flowchart of the process', 'comparison table of methods')",
                    },
                    "type": {
                        "type": "string",
                        "enum": ["mermaid", "table", "code"],
                        "description": "Visualization type",
                        "default": "mermaid",
                    },
                },
                "required": ["description"],
            },
        },
    },
]

# Gemini-compatible tool format
GEMINI_TOOL_DEFINITIONS = []
for tool in TOOL_DEFINITIONS:
    fn = tool["function"]
    GEMINI_TOOL_DEFINITIONS.append({
        "name": fn["name"],
        "description": fn["description"],
        "parameters": fn["parameters"],
    })


class ToolExecutor:
    """Executes tool calls from the AI model."""

    def __init__(self, rag_service, ai_service):
        self.rag_service = rag_service
        self.ai_service = ai_service

    def execute(self, tool_name: str, arguments: dict, session_id: str, user_id: int) -> dict:
        handler = {
            "search_documents": self._search_documents,
            "generate_quiz": self._generate_quiz,
            "create_study_guide": self._create_study_guide,
            "generate_visualization": self._generate_visualization,
        }.get(tool_name)

        if not handler:
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            return handler(arguments, session_id, user_id)
        except Exception as e:
            logger.error(f"Tool {tool_name} execution error: {e}")
            return {"error": str(e)}

    def _search_documents(self, args: dict, session_id: str, user_id: int) -> dict:
        query = args.get("query", "")
        n_results = min(args.get("n_results", 5), 12)

        result = self.rag_service.query(query, session_id, user_id, n_results=n_results)
        chunks = result.get("chunks", [])
        metas = result.get("metas", [])

        if not chunks:
            return {"results": [], "message": "No relevant passages found in the uploaded documents."}

        formatted = []
        for i, (chunk, meta) in enumerate(zip(chunks, metas)):
            pages = json.loads(meta.get("pages", "[]")) if meta else []
            formatted.append({
                "index": i + 1,
                "text": chunk,
                "pages": pages,
            })

        return {"results": formatted, "total": len(formatted)}

    def _generate_quiz(self, args: dict, session_id: str, user_id: int) -> dict:
        topic = args.get("topic", "the document content")
        num_questions = min(args.get("num_questions", 5), 10)

        # First, search for relevant content
        result = self.rag_service.query(topic, session_id, user_id, n_results=6)
        context = "\n\n".join(result.get("chunks", []))

        if not context:
            return {
                "artifact_type": "quiz",
                "content": None,
                "message": "No document content found to generate a quiz from.",
                "interactive": True,
            }

        return {
            "artifact_type": "quiz",
            "context": context,
            "topic": topic,
            "num_questions": num_questions,
            "interactive": True,
            "instruction": f"""Generate {num_questions} multiple-choice questions about '{topic}' based on the provided context.

IMPORTANT: Return ONLY a valid JSON array with no additional text, markdown formatting, or code blocks.

Each question object must have these exact fields:
- question: (string) The question text
- options: (array of exactly 4 strings) The answer choices
- correct_index: (number 0-3) Index of the correct answer in the options array
- explanation: (string) Brief explanation of why the answer is correct

Example format:
[
  {{
    "question": "What is X?",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correct_index": 1,
    "explanation": "Choice B is correct because..."
  }}
]""",
        }

    def _create_study_guide(self, args: dict, session_id: str, user_id: int) -> dict:
        topic = args.get("topic", "the document content")
        depth = args.get("depth", "standard")

        result = self.rag_service.query(topic, session_id, user_id, n_results=8)
        context = "\n\n".join(result.get("chunks", []))

        if not context:
            return {
                "artifact_type": "study_guide",
                "content": None,
                "message": "No document content found to create a study guide from.",
            }

        return {
            "artifact_type": "study_guide",
            "context": context,
            "topic": topic,
            "depth": depth,
            "instruction": f"Create a {depth} study guide about '{topic}'. Include: overview, key concepts, detailed notes, review questions. Use Markdown formatting.",
        }

    def _generate_visualization(self, args: dict, session_id: str, user_id: int) -> dict:
        description = args.get("description", "")
        viz_type = args.get("type", "mermaid")

        result = self.rag_service.query(description, session_id, user_id, n_results=5)
        context = "\n\n".join(result.get("chunks", []))

        return {
            "artifact_type": "visualization",
            "viz_type": viz_type,
            "context": context,
            "description": description,
            "instruction": f"Generate a {viz_type} visualization for: '{description}'. "
                          f"{'Use Mermaid diagram syntax wrapped in ```mermaid code block.' if viz_type == 'mermaid' else ''}"
                          f"{'Use a Markdown table.' if viz_type == 'table' else ''}"
                          f"{'Use a code block with appropriate language tag.' if viz_type == 'code' else ''}",
        }
