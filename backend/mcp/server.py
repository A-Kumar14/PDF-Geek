"""
MCP Server for FileGeek — exposes document analysis tools via Model Context Protocol.

Usage:
    python -m mcp.server

This creates an MCP-compatible server that can be connected to from
Claude Desktop, VS Code, or any MCP client.
"""

import os
import sys
import json
import logging

logger = logging.getLogger(__name__)

# Add parent dir to path so we can import from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    logger.warning("MCP package not installed. Run: pip install mcp")

from mcp.tools import get_mcp_tools


def create_mcp_server(tool_executor=None, session_id=None, user_id=None):
    """Create and configure an MCP server instance."""
    if not MCP_AVAILABLE:
        raise ImportError("MCP package required. Install with: pip install mcp")

    server = Server("filegeek")

    @server.list_tools()
    async def list_tools():
        mcp_tools = get_mcp_tools()
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in mcp_tools
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        if not tool_executor:
            return [TextContent(type="text", text="Tool executor not configured")]

        sid = session_id or arguments.pop("session_id", "mcp-session")
        uid = user_id or int(arguments.pop("user_id", 0))

        # Handle GitHub search separately
        if name == "search_github_repo":
            result = _search_github(arguments)
        else:
            result = tool_executor.execute(name, arguments, sid, uid)

        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    return server


def _search_github(args: dict) -> dict:
    """Search a GitHub repo using the GitHub API."""
    import requests as http_requests

    repo = args.get("repo", "")
    query = args.get("query", "")
    token = os.getenv("GITHUB_TOKEN", "")

    if not repo or not query:
        return {"error": "Both 'repo' and 'query' are required"}

    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        search_query = f"{query} repo:{repo}"
        resp = http_requests.get(
            "https://api.github.com/search/code",
            params={"q": search_query, "per_page": 5},
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("items", [])[:5]:
            results.append({
                "path": item.get("path"),
                "name": item.get("name"),
                "url": item.get("html_url"),
                "repository": item.get("repository", {}).get("full_name"),
            })

        return {"results": results, "total_count": data.get("total_count", 0)}

    except Exception as e:
        return {"error": f"GitHub search failed: {str(e)}"}


async def run_stdio_server(tool_executor=None, session_id=None, user_id=None):
    """Run the MCP server over stdio (for Claude Desktop integration)."""
    server = create_mcp_server(tool_executor, session_id, user_id)
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_stdio_server())
