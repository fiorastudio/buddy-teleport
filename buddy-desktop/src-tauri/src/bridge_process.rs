#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BridgeStatus {
    Offline,
    Starting,
    Online,
}

#[derive(Debug, Clone)]
pub struct BridgeProcessState {
    pub status: BridgeStatus,
    pub restart_attempts: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BridgeLaunchConfig {
    pub node_command: String,
    pub sidecar_entry: String,
    pub buddy_mcp_entry: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BridgeCommandSpec {
    pub command: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
}

impl Default for BridgeProcessState {
    fn default() -> Self {
        Self {
            status: BridgeStatus::Offline,
            restart_attempts: 0,
        }
    }
}

pub fn next_backoff_secs(attempts: u32) -> u64 {
    let delay = 2_u64.saturating_pow(attempts.min(5));
    delay.min(30)
}

pub fn bridge_command_spec(config: BridgeLaunchConfig) -> BridgeCommandSpec {
    BridgeCommandSpec {
        command: config.node_command,
        args: vec![config.sidecar_entry],
        env: vec![("BUDDY_MCP_ENTRY".to_string(), config.buddy_mcp_entry)],
    }
}

pub fn default_bridge_launch_config(app_root: &str, buddy_mcp_entry: &str) -> BridgeLaunchConfig {
    BridgeLaunchConfig {
        node_command: "node".to_string(),
        sidecar_entry: format!("{}/bridge/src/sidecar.js", app_root.trim_end_matches('/')),
        buddy_mcp_entry: buddy_mcp_entry.to_string(),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BridgeEvent {
    BuddyState(String),
    BridgeOffline(String),
    Unknown,
}

pub fn parse_bridge_event_line(line: &str) -> BridgeEvent {
    let trimmed = line.trim();
    if !trimmed.starts_with('{') {
        return BridgeEvent::Unknown;
    }

    if has_json_type(trimmed, "buddy_state") {
        return BridgeEvent::BuddyState(trimmed.to_string());
    }

    if has_json_type(trimmed, "bridge_offline") {
        return BridgeEvent::BridgeOffline(
            extract_json_string_field(trimmed, "message").unwrap_or_default(),
        );
    }

    BridgeEvent::Unknown
}

fn has_json_type(line: &str, expected: &str) -> bool {
    extract_json_string_field(line, "type").as_deref() == Some(expected)
}

fn extract_json_string_field(line: &str, field: &str) -> Option<String> {
    let marker = format!("\"{}\"", field);
    let start = line.find(&marker)?;
    let after_field = &line[start + marker.len()..];
    let colon = after_field.find(':')?;
    let after_colon = after_field[colon + 1..].trim_start();
    if !after_colon.starts_with('"') {
        return None;
    }

    let mut value = String::new();
    let mut escaped = false;
    for ch in after_colon[1..].chars() {
        if escaped {
            value.push(ch);
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == '"' {
            return Some(value);
        }
        value.push(ch);
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backoff_is_capped() {
        assert_eq!(next_backoff_secs(0), 1);
        assert_eq!(next_backoff_secs(1), 2);
        assert_eq!(next_backoff_secs(2), 4);
        assert_eq!(next_backoff_secs(9), 30);
    }

    #[test]
    fn builds_bridge_sidecar_launch_spec() {
        let config = default_bridge_launch_config(
            "/app/buddy-desktop/",
            "/Users/me/.buddy/server/dist/server/index.js",
        );
        let spec = bridge_command_spec(config);

        assert_eq!(spec.command, "node");
        assert_eq!(spec.args, vec!["/app/buddy-desktop/bridge/src/sidecar.js"]);
        assert_eq!(
            spec.env,
            vec![(
                "BUDDY_MCP_ENTRY".to_string(),
                "/Users/me/.buddy/server/dist/server/index.js".to_string()
            )]
        );
    }

    #[test]
    fn parses_buddy_state_sidecar_line_without_parsing_buddy_payload() {
        let line = r#"{"type":"buddy_state","buddy":{"name":"Drift","level":3}}"#;

        assert_eq!(
            parse_bridge_event_line(line),
            BridgeEvent::BuddyState(line.to_string())
        );
    }

    #[test]
    fn parses_bridge_offline_sidecar_line() {
        assert_eq!(
            parse_bridge_event_line(r#"{"type":"bridge_offline","message":"spawn failed"}"#),
            BridgeEvent::BridgeOffline("spawn failed".to_string())
        );
    }

    #[test]
    fn ignores_unrecognized_bridge_lines() {
        assert_eq!(parse_bridge_event_line("not json"), BridgeEvent::Unknown);
        assert_eq!(
            parse_bridge_event_line(r#"{"type":"tool_result"}"#),
            BridgeEvent::Unknown
        );
    }
}
