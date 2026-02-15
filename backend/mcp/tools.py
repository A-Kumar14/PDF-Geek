"""MCP tool definitions — wraps the same tools from services/tools.py for MCP compatibility."""

import logging

logger = logging.getLogger(__name__)


def get_mcp_tools():
    """Return tool definitions in MCP-compatible format."""
    return [
        {
            "name": "search_documents",
            "description": "Search the user's uploaded documents for information relevant to a query.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "n_results": {"type": "integer", "description": "Number of results (default 5)", "default": 5},
                },
                "required": ["query"],
            },
        },
        {
            "name": "generate_quiz",
            "description": "Generate a quiz from document content.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Quiz topic"},
                    "num_questions": {"type": "integer", "description": "Number of questions", "default": 5},
                },
                "required": ["topic"],
            },
        },
        {
            "name": "create_study_guide",
            "description": "Create a structured study guide from document content.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Study guide topic"},
                    "depth": {"type": "string", "enum": ["brief", "standard", "comprehensive"], "default": "standard"},
                },
                "required": ["topic"],
            },
        },
        {
            "name": "generate_visualization",
            "description": "Generate a visual representation (Mermaid diagrams, tables, code).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "What to visualize"},
                    "type": {"type": "string", "enum": ["mermaid", "table", "code"], "default": "mermaid"},
                },
                "required": ["description"],
            },
        },
        {
            "name": "search_github_repo",
            "description": "Search a GitHub repository for code or documentation (requires user's GitHub token).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "repo": {"type": "string", "description": "Repository in owner/name format"},
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["repo", "query"],
            },
        },
    ]
