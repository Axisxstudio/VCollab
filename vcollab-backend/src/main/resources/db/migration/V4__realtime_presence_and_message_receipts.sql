ALTER TABLE conversation_members
    ADD COLUMN last_delivered_at DATETIME(6) NULL AFTER last_read_at;

ALTER TABLE messages
    ADD COLUMN delivered_at DATETIME(6) NULL AFTER content,
    ADD COLUMN read_at DATETIME(6) NULL AFTER delivered_at;

CREATE TABLE IF NOT EXISTS user_presence (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    session_count INT NOT NULL DEFAULT 0,
    last_seen_at DATETIME(6) NULL,
    last_heartbeat_at DATETIME(6) NULL,
    active_conversation_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    deleted_by BIGINT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_presence_user (user_id),
    KEY idx_user_presence_status_seen (status, last_seen_at),
    CONSTRAINT fk_user_presence_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_presence_conversation FOREIGN KEY (active_conversation_id) REFERENCES conversations (id)
);
