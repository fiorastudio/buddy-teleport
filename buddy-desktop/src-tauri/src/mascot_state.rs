use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BuddyStats {
    pub debugging: u32,
    pub patience: u32,
    pub chaos: u32,
    pub wisdom: u32,
    pub snark: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuddyMcpState {
    pub name: String,
    pub level: u32,
    pub xp: u32,
    pub xp_to_next: u32,
    pub stats: BuddyStats,
    pub rarity: String,
    pub species: String,
    pub ascii_art: Vec<String>,
    pub personality: String,
    pub last_reaction: Option<String>,
    pub online: bool,
}

impl Default for BuddyMcpState {
    fn default() -> Self {
        Self {
            name: "buddy".into(),
            level: 1,
            xp: 0,
            xp_to_next: 17,
            stats: BuddyStats::default(),
            rarity: "COMMON".into(),
            species: "UNKNOWN".into(),
            ascii_art: vec![],
            personality: String::new(),
            last_reaction: None,
            online: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AnimationState {
    Sleep,
    Idle,
    Busy,
    Attention,
    Celebrate,
    Dizzy,
    Heart,
}

/// Compute animation state from MCP state alone (BLE layer added in Plan B).
pub fn compute_animation_state(mcp: &BuddyMcpState, prev_level: u32) -> AnimationState {
    if !mcp.online {
        return AnimationState::Sleep;
    }
    if mcp.level > prev_level {
        return AnimationState::Celebrate;
    }
    AnimationState::Idle
}
