use serde_json::Value;

#[tauri::command]
pub fn ble_respond_permission(id: String, decision: String) -> Result<Value, String> {
    build_permission_response(&id, &decision)
}

pub fn build_permission_response(id: &str, decision: &str) -> Result<Value, String> {
    let id = id.trim();
    if id.is_empty() {
        return Err("permission prompt id is required".into());
    }
    if decision != "once" && decision != "deny" {
        return Err("permission decision must be once or deny".into());
    }

    Ok(serde_json::json!({
        "cmd": "permission",
        "id": id,
        "decision": decision,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_permission_response_frame() {
        let frame = build_permission_response("req_abc123", "once").unwrap();

        assert_eq!(frame["cmd"], "permission");
        assert_eq!(frame["id"], "req_abc123");
        assert_eq!(frame["decision"], "once");
    }

    #[test]
    fn validates_permission_response_inputs() {
        assert!(build_permission_response("", "once").is_err());
        assert!(build_permission_response("req_abc123", "always").is_err());
    }
}
