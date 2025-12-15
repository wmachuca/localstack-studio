"""Pydantic models for DynamoDB operations"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ScanRequest(BaseModel):
    """Request model for scanning a table"""
    limit: int = 50
    exclusive_start_key: Optional[Dict[str, Any]] = None


class QueryRequest(BaseModel):
    """Request model for querying a table"""
    key_condition_expression: str
    expression_attribute_values: Dict[str, Any]
    index_name: Optional[str] = None
    limit: int = 50
    exclusive_start_key: Optional[Dict[str, Any]] = None


class PutItemRequest(BaseModel):
    """Request model for creating/updating an item"""
    item: Dict[str, Any]


class DeleteItemRequest(BaseModel):
    """Request model for deleting an item"""
    key: Dict[str, Any]


class GetItemRequest(BaseModel):
    """Request model for getting a single item"""
    key: Dict[str, Any]


class CreateTableRequest(BaseModel):
    """Request model for creating a table"""
    table_name: str
    key_schema: List[Dict[str, str]]  # [{"AttributeName": "id", "KeyType": "HASH"}]
    attribute_definitions: List[Dict[str, str]]  # [{"AttributeName": "id", "AttributeType": "S"}]
    billing_mode: str = "PAY_PER_REQUEST"
