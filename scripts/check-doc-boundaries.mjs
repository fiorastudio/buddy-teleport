import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "docs/superpowers/plans/2026-05-19-buddy-desktop-final-plan.md",
    required: [
      "Use `tinyhumansai/openhuman` as UX and native-window inspiration only.",
      "Do not copy OpenHuman source code or assets",
      "Rust does not speak Buddy MCP directly.",
      "TypeScript bridge: upstream Buddy MCP integration.",
    ],
  },
  {
    file: "docs/superpowers/plans/2026-05-19-buddy-desktop-user-stories.md",
    required: [
      "No Buddy upstream source files are modified.",
      "No OpenHuman code or assets are copied.",
      "Rust shell does not parse Buddy MCP responses.",
      "TDD-first, dependency-aware, parallel lanes",
    ],
  },
  {
    file: "CLAUDE.md",
    required: [
      "fiorastudio/buddy",
      "anthropics/claude-desktop-buddy",
      "Do NOT fork or copy",
      "npm run verify:automated",
      "docs/superpowers/plans/2026-05-20-buddy-desktop-manual-verification.md",
    ],
  },
  {
    file: "README.md",
    required: [
      "npm run verify:automated",
      "npm run check:manual-gates",
      "npm run smoke:popup-actions",
      "/?window=status-popup",
      "Buddy Teleport must not hatch a random desktop-only Buddy.",
      "./scripts/buddy-teleport-out.sh",
    ],
  },
  {
    file: ".claude/commands/buddy-teleport.md",
    required: [
      "./scripts/buddy-teleport-out.sh",
      "~/.buddy/buddy.db",
      "**Return**",
      "buddy_observe",
      "terminal `buddy_status`",
    ],
  },
  {
    file: "docs/superpowers/plans/2026-05-20-buddy-desktop-completion-audit.md",
    required: [
      "Latest implementation and verification commits reviewed in this audit include:",
      "d8c005d docs: document teleport return contract",
      "Completed implementation and verification work is committed and pushed to `origin/main`",
      "npm run verify:automated",
      "npm run smoke:popup-actions",
      "/?window=status-popup",
      "docs/superpowers/plans/2026-05-20-buddy-desktop-manual-verification.md",
    ],
  },
  {
    file: "docs/superpowers/plans/2026-05-20-buddy-desktop-manual-verification.md",
    required: [
      "Terminal Buddy Identity",
      "npm run check:manual-gates",
      "/?window=status-popup",
      "Popup Actions",
      "Return To Terminal",
      "Tray/Menu Bar",
      "Claude Desktop BLE Pairing",
    ],
  },
];

let failed = false;

for (const check of checks) {
  const text = await readFile(check.file, "utf8");
  for (const needle of check.required) {
    if (!text.includes(needle)) {
      failed = true;
      console.error(`Missing required boundary text in ${check.file}: ${needle}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("docs boundary checks passed");
}
