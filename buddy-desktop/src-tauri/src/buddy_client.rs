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
    let card = strip_ansi(card);
    let header_re = Regex::new(r"★+\s+([A-Z][A-Z0-9_-]*)\s+(.+?)\s*$").unwrap();
    let stat_re = Regex::new(r"(DEBUGGING|PATIENCE|CHAOS|WISDOM|SNARK)\s+[█▓░]+\s+(\d+)").unwrap();
    let level_re = Regex::new(r"Lv\.(\d+)\s*·\s*(\d+)/(\d+)").unwrap();

    let inner_lines: Vec<String> = card.lines().map(strip_card_border).collect();

    let (rarity, species) = inner_lines
        .iter()
        .find_map(|line| {
            header_re.captures(line).map(|captures| {
                (
                    captures[1].trim().to_string(),
                    captures[2].trim().to_string(),
                )
            })
        })
        .unwrap_or_default();

    let mut stats = crate::mascot_state::BuddyStats::default();
    for cap in stat_re.captures_iter(&card) {
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

    let (level, xp, xp_to_next) = level_re.captures(&card)
        .map(|c| (
            c[1].parse().unwrap_or(1),
            c[2].parse().unwrap_or(0),
            c[3].parse().unwrap_or(17),
        ))
        .unwrap_or((1, 0, 17));

    let first_stat_index = inner_lines
        .iter()
        .position(|line| stat_re.is_match(line))
        .ok_or("stat card did not contain Buddy stats")?;

    let (name, personality) = extract_identity(&inner_lines[..first_stat_index]);
    let ascii_art = extract_sprite_lines(&inner_lines[..first_stat_index], &name);

    Ok(BuddyMcpState {
        name,
        level,
        xp,
        xp_to_next,
        stats,
        rarity,
        species,
        ascii_art,
        personality,
        last_reaction: None,
        online: true,
    })
}

fn extract_identity(lines_before_stats: &[String]) -> (String, String) {
    let mut skip_bio = false;
    let mut bio_lines = Vec::new();
    let mut name = None;

    for line in lines_before_stats.iter().rev() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.contains('★') || is_border_line(trimmed) {
            continue;
        }

        if skip_bio || trimmed.ends_with('"') || trimmed.starts_with('"') {
            bio_lines.push(trimmed.to_string());
            skip_bio = !trimmed.starts_with('"');
            continue;
        }

        if looks_like_name(trimmed) {
            name = Some(trimmed.to_string());
            break;
        }
    }

    bio_lines.reverse();
    let personality = bio_lines
        .join(" ")
        .trim()
        .trim_matches('"')
        .to_string();

    (name.unwrap_or_else(|| "buddy".to_string()), personality)
}

fn strip_card_border(line: &str) -> String {
    line.trim()
        .trim_start_matches(|c| c == '|' || c == '.' || c == '\'' || c == '`')
        .trim_end_matches(|c| c == '|' || c == '\'' || c == '`')
        .trim()
        .to_string()
}

fn strip_ansi(value: &str) -> String {
    Regex::new(r"\x1b\[[0-9;]*m").unwrap().replace_all(value, "").to_string()
}

fn extract_sprite_lines(lines_before_stats: &[String], name: &str) -> Vec<String> {
    lines_before_stats
        .iter()
        .filter_map(|line| {
            let trimmed = line.trim_end();
            if trimmed.trim().is_empty()
                || trimmed.contains('★')
                || is_border_line(trimmed.trim())
                || trimmed.trim() == name
                || trimmed.trim().starts_with('"')
                || trimmed.trim().ends_with('"')
                || looks_like_stat_card_text(trimmed)
            {
                return None;
            }

            if trimmed.chars().any(|c| !c.is_alphanumeric() && !c.is_whitespace()) {
                Some(trimmed.to_string())
            } else {
                None
            }
        })
        .collect()
}

fn looks_like_stat_card_text(line: &str) -> bool {
    line.contains("DISPLAY VERBATIM")
        || line.contains("Show the full stat card")
        || line.contains("Do not summarize")
}

fn is_border_line(line: &str) -> bool {
    line.chars().all(|c| c == '_' || c == '.' || c == '\'' || c == '`' || c == '-')
}

fn looks_like_name(line: &str) -> bool {
    !line.contains("DEBUGGING")
        && !line.contains("PATIENCE")
        && !line.contains("CHAOS")
        && !line.contains("WISDOM")
        && !line.contains("SNARK")
        && !line.contains("Lv.")
        && line.chars().any(|c| c.is_alphanumeric())
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
        assert!(state.ascii_art.is_empty());
    }

    #[test]
    fn test_parse_upstream_card_with_multiword_species_and_personality() {
        let card = r#"
DISPLAY VERBATIM: Show the full stat card below in a code block. Do not summarize.

.__________________________________________.
| ★★ RARE                         VOID CAT |
|                                          |
|  |\      /|                              |
|  | \____/ |                              |
|  |  o  o  |                              |
|  |   ^^   |                              |
|   \______/                               |
|                                          |
| Ada                                      |
|                                          |
| "Precise and impatient, but loyal to     |
| the terminal session."                   |
|                                          |
| DEBUGGING  █████▓░░   69                 |
| PATIENCE   ███▓░░░░   43                 |
| CHAOS      ██▓░░░░░   31                 |
| WISDOM     ███████░   88                 |
| SNARK      █▓░░░░░░   19                 |
|                                          |
| Lv.3 · 4/28 XP to next                   |
'__________________________________________'
"#;

        let state = parse_stat_card(&format!("\x1b[36m{card}\x1b[0m")).unwrap();

        assert_eq!(state.name, "Ada");
        assert_eq!(state.rarity, "RARE");
        assert_eq!(state.species, "VOID CAT");
        assert_eq!(state.level, 3);
        assert_eq!(state.xp_to_next, 28);
        assert_eq!(state.stats.wisdom, 88);
        assert_eq!(state.personality, "Precise and impatient, but loyal to the terminal session.");
        assert_eq!(state.ascii_art, vec![
            "|\\      /|",
            "| \\____/ |",
            "|  o  o  |",
            "|   ^^   |",
            "\\______/",
        ]);
        assert!(!state.ascii_art.iter().any(|line| line.contains("DEBUGGING") || line.contains("Lv.")));
    }

    #[test]
    fn live_buddy_sidecar_uses_existing_db_and_supports_pet_observe_when_env_is_set() {
        let Ok(sidecar_path) = std::env::var("BUDDY_TELEPORT_LIVE_SIDECAR") else {
            eprintln!("set BUDDY_TELEPORT_LIVE_SIDECAR to run live Buddy teleport smoke");
            return;
        };

        let sidecar = crate::buddy_sidecar::BuddySidecar::spawn(&sidecar_path).unwrap();
        let mut client = BuddyClient::new(sidecar);
        client.initialize().unwrap();

        let hatch = client.call_tool("buddy_hatch", json!({
            "name": "TeleportAda",
            "species": "Robot",
            "user_id": "teleport-smoke"
        })).unwrap();
        assert!(hatch.get("error").is_none(), "{hatch}");

        let status = client.get_status().unwrap();
        assert_eq!(status.name, "TeleportAda");
        assert_eq!(status.species, "ROBOT");
        assert!(status.online);

        let pet = client.call_tool("buddy_pet", json!({})).unwrap();
        assert!(pet.get("error").is_none(), "{pet}");

        let observe = client.call_tool("buddy_observe", json!({
            "summary": "verified teleport smoke from Rust sidecar",
            "claims": [],
            "edges": []
        })).unwrap();
        assert!(observe.get("error").is_none(), "{observe}");

        let after_tools = client.get_status().unwrap();
        assert_eq!(after_tools.name, "TeleportAda");
        assert_eq!(after_tools.species, "ROBOT");
        assert!(after_tools.xp >= status.xp);
    }
}
