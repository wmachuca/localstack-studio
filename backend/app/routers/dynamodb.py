"""DynamoDB API endpoints"""
from fastapi import APIRouter, HTTPException
from app.services.dynamodb_service import DynamoDBService
from app.models.dynamodb import (
    ScanRequest,
    QueryRequest,
    PutItemRequest,
    DeleteItemRequest,
    GetItemRequest,
    CreateTableRequest
)
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize DynamoDB service
dynamodb_service = DynamoDBService()


@router.get("/tables")
async def list_tables():
    """
    List all DynamoDB tables

    Returns:
        List of tables with metadata
    """
    try:
        tables = dynamodb_service.list_tables()
        return {
            "tables": tables,
            "count": len(tables)
        }
    except Exception as e:
        logger.error(f"Error listing tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}")
async def describe_table(table_name: str):
    """
    Get detailed table schema and metadata

    Args:
        table_name: Name of the table

    Returns:
        Table schema including keys, attributes, GSIs, LSIs
    """
    try:
        table_info = dynamodb_service.describe_table(table_name)
        return table_info
    except Exception as e:
        logger.error(f"Error describing table {table_name}: {e}")
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found")


@router.post("/tables/{table_name}/scan")
async def scan_table(table_name: str, request: ScanRequest):
    """
    Scan table items with pagination

    Args:
        table_name: Name of the table
        request: ScanRequest with limit and pagination token

    Returns:
        Items, pagination info, and counts
    """
    try:
        result = dynamodb_service.scan_table(
            table_name=table_name,
            limit=request.limit,
            exclusive_start_key=request.exclusive_start_key
        )
        logger.info(f"Scanned {result['count']} items from {table_name}")
        return result
    except Exception as e:
        logger.error(f"Error scanning table {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables/{table_name}/query")
async def query_table(table_name: str, request: QueryRequest):
    """
    Query table items with key conditions

    Args:
        table_name: Name of the table
        request: QueryRequest with key conditions and parameters

    Returns:
        Items matching the query and pagination info
    """
    try:
        result = dynamodb_service.query_table(
            table_name=table_name,
            key_condition_expression=request.key_condition_expression,
            expression_attribute_values=request.expression_attribute_values,
            index_name=request.index_name,
            limit=request.limit,
            exclusive_start_key=request.exclusive_start_key
        )
        logger.info(f"Queried {result['count']} items from {table_name}")
        return result
    except Exception as e:
        logger.error(f"Error querying table {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables/{table_name}/items/get")
async def get_item(table_name: str, request: GetItemRequest):
    """
    Get single item by key

    Args:
        table_name: Name of the table
        request: GetItemRequest with key

    Returns:
        Single item or null if not found
    """
    try:
        item = dynamodb_service.get_item(
            table_name=table_name,
            key=request.key
        )

        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"item": item}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting item from {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables/{table_name}/items")
async def put_item(table_name: str, request: PutItemRequest):
    """
    Create or update an item

    Args:
        table_name: Name of the table
        request: PutItemRequest with item data

    Returns:
        Success status
    """
    try:
        result = dynamodb_service.put_item(
            table_name=table_name,
            item=request.item
        )
        logger.info(f"Item created/updated in {table_name}")
        return result
    except Exception as e:
        logger.error(f"Error putting item in {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tables/{table_name}/items")
async def delete_item(table_name: str, request: DeleteItemRequest):
    """
    Delete an item by key

    Args:
        table_name: Name of the table
        request: DeleteItemRequest with key

    Returns:
        Success status
    """
    try:
        dynamodb_service.delete_item(
            table_name=table_name,
            key=request.key
        )
        logger.info(f"Item deleted from {table_name}")
        return {"success": True, "message": "Item deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting item from {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables")
async def create_table(request: CreateTableRequest):
    """
    Create a new DynamoDB table

    Args:
        request: CreateTableRequest with table schema

    Returns:
        Table description
    """
    try:
        result = dynamodb_service.create_table(
            table_name=request.table_name,
            key_schema=request.key_schema,
            attribute_definitions=request.attribute_definitions,
            billing_mode=request.billing_mode
        )
        logger.info(f"Table created: {request.table_name}")
        return result
    except Exception as e:
        logger.error(f"Error creating table {request.table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tables/{table_name}")
async def delete_table(table_name: str):
    """
    Delete a DynamoDB table

    Args:
        table_name: Name of the table to delete

    Returns:
        Success status
    """
    try:
        dynamodb_service.delete_table(table_name)
        logger.info(f"Table deleted: {table_name}")
        return {"success": True, "message": f"Table {table_name} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting table {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
