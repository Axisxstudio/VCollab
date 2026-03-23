SET @schema_name = DATABASE();

SET @conversation_last_message_id_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'conversations'
      AND column_name = 'last_message_id'
);
SET @conversation_last_message_id_sql = IF(
    @conversation_last_message_id_exists = 0,
    'ALTER TABLE conversations ADD COLUMN last_message_id BIGINT NULL AFTER created_by',
    'SELECT 1'
);
PREPARE conversation_last_message_id_stmt FROM @conversation_last_message_id_sql;
EXECUTE conversation_last_message_id_stmt;
DEALLOCATE PREPARE conversation_last_message_id_stmt;

SET @conversation_last_message_at_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'conversations'
      AND column_name = 'last_message_at'
);
SET @conversation_last_message_at_sql = IF(
    @conversation_last_message_at_exists = 0,
    'ALTER TABLE conversations ADD COLUMN last_message_at DATETIME(6) NULL AFTER last_message_id',
    'SELECT 1'
);
PREPARE conversation_last_message_at_stmt FROM @conversation_last_message_at_sql;
EXECUTE conversation_last_message_at_stmt;
DEALLOCATE PREPARE conversation_last_message_at_stmt;

SET @conversation_is_group_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'conversations'
      AND column_name = 'is_group'
);
SET @conversation_is_group_sql = IF(
    @conversation_is_group_exists = 0,
    'ALTER TABLE conversations ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT FALSE AFTER last_message_at',
    'SELECT 1'
);
PREPARE conversation_is_group_stmt FROM @conversation_is_group_sql;
EXECUTE conversation_is_group_stmt;
DEALLOCATE PREPARE conversation_is_group_stmt;

SET @message_type_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'messages'
      AND column_name = 'message_type'
);
SET @message_type_sql = IF(
    @message_type_exists = 0,
    'ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) NOT NULL DEFAULT ''TEXT'' AFTER content',
    'SELECT 1'
);
PREPARE message_type_stmt FROM @message_type_sql;
EXECUTE message_type_stmt;
DEALLOCATE PREPARE message_type_stmt;

SET @attachment_url_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'messages'
      AND column_name = 'attachment_url'
);
SET @attachment_url_sql = IF(
    @attachment_url_exists = 0,
    'ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(1024) NULL AFTER message_type',
    'SELECT 1'
);
PREPARE attachment_url_stmt FROM @attachment_url_sql;
EXECUTE attachment_url_stmt;
DEALLOCATE PREPARE attachment_url_stmt;

SET @message_is_deleted_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'messages'
      AND column_name = 'is_deleted'
);
SET @message_is_deleted_sql = IF(
    @message_is_deleted_exists = 0,
    'ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER attachment_url',
    'SELECT 1'
);
PREPARE message_is_deleted_stmt FROM @message_is_deleted_sql;
EXECUTE message_is_deleted_stmt;
DEALLOCATE PREPARE message_is_deleted_stmt;

SET @reply_to_id_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'messages'
      AND column_name = 'reply_to_id'
);
SET @reply_to_id_sql = IF(
    @reply_to_id_exists = 0,
    'ALTER TABLE messages ADD COLUMN reply_to_id BIGINT NULL AFTER is_deleted',
    'SELECT 1'
);
PREPARE reply_to_id_stmt FROM @reply_to_id_sql;
EXECUTE reply_to_id_stmt;
DEALLOCATE PREPARE reply_to_id_stmt;
