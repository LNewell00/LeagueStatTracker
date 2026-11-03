use std::time::Duration;

#[tauri::command]
pub async fn poll_live_client_data() -> Result<serde_json::Value, String> {
    // League Live Client runs on 127.0.0.1:2999 with a self-signed TLS certificate
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_millis(1500))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = "https://127.0.0.1:2999/liveclientdata/allgamedata";

    match client.get(url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                let json: serde_json::Value = res
                    .json()
                    .await
                    .map_err(|e| format!("Failed to parse live client JSON: {}", e))?;
                Ok(json)
            } else {
                Err(format!("Live client HTTP error: {}", res.status()))
            }
        }
        Err(e) => {
            // League is usually closed or not in active gameplay
            Err(format!("Game client offline or not in active match: {}", e))
        }
    }
}

