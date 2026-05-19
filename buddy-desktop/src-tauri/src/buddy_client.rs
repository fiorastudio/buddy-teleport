use crate::buddy_sidecar::BuddySidecar;
use crate::mascot_state::BuddyMcpState;
use regex::Regex;
use serde_json::{json, Value};

pub struct BuddyClient {
    sidecar: BuddySidecar,
    next_id: u64,
}

impl BuddyClient {
    pub fn new(sidecar: BuddySidecar) -> Self {
        Self { sidecar, next_id: 1 }
    }

    fn next_id(&mut self) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    /// Perform MCP initialize handshake. Must be called once before call_tool.
    pub fn initialize(&mut self) -> Result<(), String> {
        let id = self.next_id();
        let req = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "openhuman", "version": "0.1.0"}
            }
        });
        let resp = self.sidecar.send_recv(&req)?;
        if resp.get("error").is_some() {
            return Err(format!("initialize error: {}", resp["error"]));
        }
        // Send initialized notification (no response expected — fire and forget)
        let notif = json!({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}});
        let mut line = serde_json::to_string(&notif).unwrap();
        line.push('\n');
        use std::io::Write;
        self.sidecar.stdin.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
        self.sidecar.stdin.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Call a buddy MCP tool and return the raw JSON response.
    pub fn call_tool(&mut self, name: &str, args: Value) -> Result<Value, String> {
        let id = self.next_id();
        let req = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "tools/call",
            "params": {"name": name, "arguments": args}
        });
        self.sidecar.send_recv(&req)
    }

    /// Call buddy_status and parse the stat card into BuddyMcpState.
    pub fn get_status(&mut self) -> Result<BuddyMcpState, String> {
        let resp = self.call_tool("buddy_status", json!({}))?;
        let text = resp["result"]["content"]
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|c| c["text"].as_str())
            .ok_or("buddy_status: no text content in response")?;
        parse_stat_card(text)
    }
}

/// Parse a buddy stat card text block into BuddyMcpState.
pub fn parse_stat_card(card: &str) -> Result<BuddyMcpState, String> {
    // Rarity + species: "| ★ COMMON                         PENGUIN |"
    let rarity_re = Regex::new(r"★\s+(\w+)").unwrap();
    let species_re = Regex::new(r"★\s+\w+\s+(\w+)").unwrap();
    // Name line: "| buddy                                    |"
    let stat_re = Regex::new(r"(DEBUGGING|PATIENCE|CHAOS|WISDOM|SNARK)\s+[█▓░]+\s+(\d+)").unwrap();
    let level_re = Regex::new(r"Lv\.(\d+)\s*·\s*(\d+)/(\d+)").unwrap();

    let rarity = rarity_re.captures(card)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    let species = species_re.captures(card)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_default();

    let mut stats = crate::mascot_state::BuddyStats::default();
    for cap in stat_re.captures_iter(card) {
        let val: u32 = cap[2].parse().unwrap_or(0);
        match &cap[1] {
            "DEBUGGING" => stats.debugging = val,
            "PATIENCE"  => stats.patience = val,
            "CHAOS"     => stats.chaos = val,
            "WISDOM"    => stats.wisdom = val,
            "SNARK"     => stats.snark = val,
            _ => {}
        }
    }

    let (level, xp, xp_to_next) = level_re.captures(card)
        .map(|c| (
            c[1].parse().unwrap_or(1),
            c[2].parse().unwrap_or(0),
            c[3].parse().unwrap_or(17),
        ))
        .unwrap_or((1, 0, 17));

    let name = card.lines()
        .map(|l| l.trim_matches(|c| c == '|' || c == ' '))
        .filter(|l| !l.is_empty()
            && !l.contains('★')
            && !l.contains("DEBUGGING") && !l.contains("PATIENCE")
            && !l.contains("CHAOS") && !l.contains("WISDOM") && !l.contains("SNARK")
            && !l.contains("Lv.")
            && !l.starts_with('.') && !l.starts_with('\'')
            && l.chars().all(|c| c.is_alphanumeric() || c == ' ' || c == '-' || c == '_'))
        .next()
        .unwrap_or("buddy")
        .trim()
        .to_string();

    let ascii_art: Vec<String> = card.lines().map(|l| l.to_string()).collect();

    Ok(BuddyMcpState {
        name,
        level,
        xp,
        xp_to_next,
        stats,
        rarity,
        species,
        ascii_art,
        personality: String::new(),
        last_reaction: None,
        online: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_CARD: &str = r#"
.__________________________________________.
| ★ COMMON                         PENGUIN |
|                                          |
| buddy                                    |
|                                          |
| DEBUGGING  █░░░░░░░   14                 |
| PATIENCE   ▓░░░░░░░   11                 |
| CHAOS      ██░░░░░░   26                 |
| WISDOM     ░░░░░░░░    3                 |
| SNARK      ████▓░░░   59                 |
|                                          |
| Lv.1 · 3/17 XP to next                   |
'__________________________________________'
"#;

    #[test]
    fn test_parse_stat_card() {
        let state = parse_stat_card(SAMPLE_CARD).unwrap();
        assert_eq!(state.name, "buddy");
        assert_eq!(state.rarity, "COMMON");
        assert_eq!(state.species, "PENGUIN");
        assert_eq!(state.stats.debugging, 14);
        assert_eq!(state.level, 1);
        assert_eq!(state.xp, 3);
    }
}
