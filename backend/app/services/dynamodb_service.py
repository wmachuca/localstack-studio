"""DynamoDB Service module for interacting with LocalStack DynamoDB"""
import boto3
import os
import logging
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError
from decimal import Decimal
import json

logger = logging.getLogger(__name__)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


class DynamoDBService:
    """Service class for DynamoDB operations"""

    def __init__(self):
        """Initialize DynamoDB client and resource with LocalStack configuration"""
        self.endpoint_url = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:4566")
        self.region = os.getenv("AWS_REGION", "us-east-1")

        self.client = boto3.client(
            "dynamodb",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

        self.resource = boto3.resource(
            "dynamodb",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

    def list_tables(self) -> List[Dict[str, Any]]:
        """
        List all DynamoDB tables with metadata

        Returns:
            List of table information dictionaries
        """
        try:
            response = self.client.list_tables()
            table_names = response.get("TableNames", [])

            tables = []
            for table_name in table_names:
                try:
                    # Get table description for metadata
                    table_desc = self.client.describe_table(TableName=table_name)
                    table_info = table_desc.get("Table", {})

                    tables.append({
                        "name": table_name,
                        "itemCount": table_info.get("ItemCount", 0),
                        "sizeBytes": table_info.get("TableSizeBytes", 0),
                        "status": table_info.get("TableStatus", "UNKNOWN"),
                        "creationDateTime": str(table_info.get("CreationDateTime", ""))
                    })
                except ClientError as e:
                    logger.error(f"Error getting metadata for table {table_name}: {e}")
                    # Add table with minimal info if metadata fetch fails
                    tables.append({
                        "name": table_name,
                        "itemCount": 0,
                        "sizeBytes": 0,
                        "status": "UNKNOWN",
                        "creationDateTime": ""
                    })

            # Sort tables by creation date
            tables.sort(key=lambda t: t.get("creationDateTime", ""))

            return tables
        except ClientError as e:
            logger.error(f"Error listing tables: {e}")
            return []

    def describe_table(self, table_name: str) -> Dict[str, Any]:
        """
        Get detailed table schema and metadata

        Args:
            table_name: Name of the table

        Returns:
            Dictionary with table schema including keys, attributes, GSIs, LSIs
        """
        try:
            response = self.client.describe_table(TableName=table_name)
            table = response.get("Table", {})

            # Extract key schema
            key_schema = table.get("KeySchema", [])
            partition_key = next((k for k in key_schema if k["KeyType"] == "HASH"), None)
            sort_key = next((k for k in key_schema if k["KeyType"] == "RANGE"), None)

            # Extract attribute definitions
            attribute_definitions = {
                attr["AttributeName"]: attr["AttributeType"]
                for attr in table.get("AttributeDefinitions", [])
            }

            return {
                "name": table_name,
                "status": table.get("TableStatus", ""),
                "itemCount": table.get("ItemCount", 0),
                "sizeBytes": table.get("TableSizeBytes", 0),
                "partitionKey": {
                    "name": partition_key["AttributeName"] if partition_key else None,
                    "type": attribute_definitions.get(partition_key["AttributeName"]) if partition_key else None
                },
                "sortKey": {
                    "name": sort_key["AttributeName"] if sort_key else None,
                    "type": attribute_definitions.get(sort_key["AttributeName"]) if sort_key else None
                },
                "attributes": attribute_definitions,
                "keySchema": [{"attributeName": k["AttributeName"], "keyType": k["KeyType"]} for k in key_schema],
                "attributeDefinitions": [{"attributeName": k, "attributeType": v} for k, v in attribute_definitions.items()],
                "globalSecondaryIndexes": table.get("GlobalSecondaryIndexes", []),
                "localSecondaryIndexes": table.get("LocalSecondaryIndexes", []),
                "creationDateTime": str(table.get("CreationDateTime", ""))
            }
        except ClientError as e:
            logger.error(f"Error describing table {table_name}: {e}")
            raise

    def scan_table(
        self,
        table_name: str,
        limit: int = 50,
        exclusive_start_key: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Scan table items with pagination

        Args:
            table_name: Name of the table
            limit: Maximum number of items to return
            exclusive_start_key: Pagination token from previous scan

        Returns:
            Dictionary with items, lastEvaluatedKey, count, scannedCount
        """
        try:
            table = self.resource.Table(table_name)

            scan_params = {"Limit": limit}

            if exclusive_start_key:
                scan_params["ExclusiveStartKey"] = exclusive_start_key

            response = table.scan(**scan_params)

            # Convert Decimal to native Python types
            items = json.loads(json.dumps(response.get("Items", []), cls=DecimalEncoder))

            return {
                "items": items,
                "lastEvaluatedKey": response.get("LastEvaluatedKey"),
                "count": response.get("Count", 0),
                "scannedCount": response.get("ScannedCount", 0)
            }
        except ClientError as e:
            logger.error(f"Error scanning table {table_name}: {e}")
            raise

    def query_table(
        self,
        table_name: str,
        key_condition_expression: str,
        expression_attribute_values: Dict[str, Any],
        index_name: Optional[str] = None,
        limit: int = 50,
        exclusive_start_key: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Query table items with key conditions

        Args:
            table_name: Name of the table
            key_condition_expression: Key condition expression (e.g., "id = :id")
            expression_attribute_values: Values for expression (e.g., {":id": "123"})
            index_name: Optional GSI/LSI name
            limit: Maximum number of items to return
            exclusive_start_key: Pagination token

        Returns:
            Dictionary with items, lastEvaluatedKey, count
        """
        try:
            table = self.resource.Table(table_name)

            query_params = {
                "KeyConditionExpression": key_condition_expression,
                "ExpressionAttributeValues": expression_attribute_values,
                "Limit": limit
            }

            if index_name:
                query_params["IndexName"] = index_name

            if exclusive_start_key:
                query_params["ExclusiveStartKey"] = exclusive_start_key

            response = table.query(**query_params)

            # Convert Decimal to native Python types
            items = json.loads(json.dumps(response.get("Items", []), cls=DecimalEncoder))

            return {
                "items": items,
                "lastEvaluatedKey": response.get("LastEvaluatedKey"),
                "count": response.get("Count", 0)
            }
        except ClientError as e:
            logger.error(f"Error querying table {table_name}: {e}")
            raise

    def get_item(self, table_name: str, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get single item by key

        Args:
            table_name: Name of the table
            key: Primary key (e.g., {"id": "123"} or {"pk": "123", "sk": "abc"})

        Returns:
            Item dictionary or None if not found
        """
        try:
            table = self.resource.Table(table_name)
            response = table.get_item(Key=key)

            item = response.get("Item")
            if item:
                # Convert Decimal to native Python types
                return json.loads(json.dumps(item, cls=DecimalEncoder))

            return None
        except ClientError as e:
            logger.error(f"Error getting item from {table_name}: {e}")
            raise

    def put_item(self, table_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update item

        Args:
            table_name: Name of the table
            item: Item data dictionary

        Returns:
            Success status
        """
        try:
            table = self.resource.Table(table_name)
            table.put_item(Item=item)

            return {
                "success": True,
                "message": "Item created/updated successfully"
            }
        except ClientError as e:
            logger.error(f"Error putting item in {table_name}: {e}")
            raise

    def delete_item(self, table_name: str, key: Dict[str, Any]) -> bool:
        """
        Delete item by key

        Args:
            table_name: Name of the table
            key: Primary key

        Returns:
            True if successful
        """
        try:
            table = self.resource.Table(table_name)
            table.delete_item(Key=key)
            return True
        except ClientError as e:
            logger.error(f"Error deleting item from {table_name}: {e}")
            raise

    def create_table(
        self,
        table_name: str,
        key_schema: List[Dict[str, str]],
        attribute_definitions: List[Dict[str, str]],
        billing_mode: str = "PAY_PER_REQUEST"
    ) -> Dict[str, Any]:
        """
        Create a new DynamoDB table

        Args:
            table_name: Name of the table
            key_schema: Key schema definition
            attribute_definitions: Attribute definitions
            billing_mode: Billing mode (PAY_PER_REQUEST or PROVISIONED)

        Returns:
            Table description
        """
        try:
            params = {
                "TableName": table_name,
                "KeySchema": key_schema,
                "AttributeDefinitions": attribute_definitions,
                "BillingMode": billing_mode
            }

            response = self.client.create_table(**params)

            return {
                "success": True,
                "tableName": table_name,
                "tableArn": response["TableDescription"]["TableArn"],
                "status": response["TableDescription"]["TableStatus"]
            }
        except ClientError as e:
            logger.error(f"Error creating table {table_name}: {e}")
            raise

    def delete_table(self, table_name: str) -> bool:
        """
        Delete a DynamoDB table

        Args:
            table_name: Name of the table to delete

        Returns:
            True if successful
        """
        try:
            self.client.delete_table(TableName=table_name)
            return True
        except ClientError as e:
            logger.error(f"Error deleting table {table_name}: {e}")
            raise
