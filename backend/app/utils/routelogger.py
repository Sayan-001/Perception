import json
import os
import time
import inspect
from pathlib import Path
from rich.console import Console
from rich.table import Table
from typing import Callable

from app.utils.keys import API_DOCS_PATH

route_db = []
API_DOCS_PATH = Path(fr"{API_DOCS_PATH}")

def log_route(path: str, method: str):
    """Decorator to log routes and save to JSON file."""
    
    def decorator(func: Callable) -> Callable:
        signature = inspect.signature(func)
        params_info = {}
        
        for name, param in signature.parameters.items():
            if name == 'self':
                continue
                
            param_info = {
                "required": param.default == param.empty,
                "type": str(param.annotation) if param.annotation != param.empty else "Any"
            }
            
            if param.default != param.empty:
                try:
                    if isinstance(param.default, (str, int, float, bool, type(None))):
                        param_info["default"] = param.default
                except:
                    param_info["default"] = str(param.default)
                    
            params_info[name] = param_info
    
        docstring = inspect.getdoc(func) or ""
        
        route_info = {
            "path": path,
            "method": method,
            "description": docstring,
            "parameters": params_info,
            "function_name": func.__name__
        }
        
        route_db.append(route_info)
        _update_json_file()
        
        return func
    
    return decorator

def _update_json_file():
    """Update the JSON file with the current route database."""
    
    try:
        os.makedirs(os.path.dirname(API_DOCS_PATH), exist_ok=True)
        with open(API_DOCS_PATH, 'w') as f:
            json.dump(
                {
                    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "endpoints": route_db
                }, 
                f, 
                indent=2
            )
    except Exception as e:
        print(f"Error writing to JSON file: {e}")

def print_route_db():
    """Prints the route database."""
    
    console = Console()
    
    table = Table(title="FastAPI Routes")
    table.add_column("Path", justify="left", style="cyan")
    table.add_column("Method", justify="center", style="magenta")
    table.add_column("Summary", justify="left", style="green")
    table.add_column("Parameters", justify="left", style="yellow")

    for route in route_db:
        param_str = ", ".join(route.get("parameters", {}).keys())
        table.add_row(route["path"], route["method"], route["description"], param_str)

    console.print(table)