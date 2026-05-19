use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

pub struct BuddySidecar {
    pub child: Child,
    pub stdin: ChildStdin,
    reader: BufReader<ChildStdout>,
}

impl BuddySidecar {
    /// Spawn buddy sidecar. `binary_path` is the absolute path to the pkg binary.
    pub fn spawn(binary_path: &str) -> Result<Self, String> {
        let mut child = Command::new(binary_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("failed to spawn buddy: {e}"))?;

        let stdin = child.stdin.take().ok_or("no stdin")?;
        let stdout = child.stdout.take().ok_or("no stdout")?;
        let reader = BufReader::new(stdout);

        Ok(Self { child, stdin, reader })
    }

    /// Send a JSON-RPC line and read the response line.
    pub fn send_recv(&mut self, request: &serde_json::Value) -> Result<serde_json::Value, String> {
        let mut line = serde_json::to_string(request).map_err(|e| e.to_string())?;
        line.push('\n');
        self.stdin.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
        self.stdin.flush().map_err(|e| e.to_string())?;

        let mut response = String::new();
        self.reader.read_line(&mut response).map_err(|e| e.to_string())?;

        serde_json::from_str(response.trim()).map_err(|e| format!("parse error: {e} — raw: {response}"))
    }
}

impl Drop for BuddySidecar {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_send_recv_with_cat() {
        let mut child = std::process::Command::new("cat")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();
        let mut real = BuddySidecar {
            child,
            stdin,
            reader: BufReader::new(stdout),
        };

        let req = serde_json::json!({"jsonrpc": "2.0", "id": 1, "method": "ping"});
        let resp = real.send_recv(&req).unwrap();
        assert_eq!(resp["method"], "ping");
    }
}
