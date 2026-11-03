use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RiotAccountResponse {
    pub puuid: String,
    #[serde(rename = "gameName")]
    pub game_name: String,
    #[serde(rename = "tagLine")]
    pub tag_line: String,
}

#[tauri::command]
pub async fn get_riot_account(
    game_name: String,
    tag_line: String,
    regional_routing: String,
    api_key: String,
) -> Result<RiotAccountResponse, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://{}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{}/{}",
        regional_routing,
        urlencoding(&game_name),
        urlencoding(&tag_line)
    );

    let res = client
        .get(&url)
        .header("X-Riot-Token", &api_key)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Riot API error (HTTP {}): {}", status, body));
    }

    let account: RiotAccountResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse account response: {}", e))?;

    Ok(account)
}

#[tauri::command]
pub async fn get_match_ids(
    puuid: String,
    regional_routing: String,
    count: u32,
    start: Option<u32>,
    api_key: String,
) -> Result<Vec<String>, String> {
    let start_idx = start.unwrap_or(0);
    let client = reqwest::Client::new();
    let url = format!(
        "https://{}.api.riotgames.com/lol/match/v5/matches/by-puuid/{}/ids?start={}&count={}",
        regional_routing, puuid, start_idx, count
    );

    let res = client
        .get(&url)
        .header("X-Riot-Token", &api_key)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch match IDs: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Riot API error: HTTP {}", res.status()));
    }

    let match_ids: Vec<String> = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse match ID list: {}", e))?;

    Ok(match_ids)
}

#[tauri::command]
pub async fn get_match_detail(
    match_id: String,
    regional_routing: String,
    api_key: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://{}.api.riotgames.com/lol/match/v5/matches/{}",
        regional_routing, match_id
    );

    let mut attempts = 0;
    loop {
        attempts += 1;
        let res = client
            .get(&url)
            .header("X-Riot-Token", &api_key)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch match details for {}: {}", match_id, e))?;

        if res.status() == reqwest::StatusCode::TOO_MANY_REQUESTS && attempts <= 3 {
            // Check Retry-After header sent by Riot Games API
            let wait_secs = res
                .headers()
                .get("Retry-After")
                .and_then(|h| h.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(2);

            tokio::time::sleep(tokio::time::Duration::from_secs(wait_secs)).await;
            continue;
        }

        if !res.status().is_success() {
            return Err(format!("Riot API error (HTTP {}): {}", res.status(), match_id));
        }

        let detail: serde_json::Value = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse match JSON: {}", e))?;

        return Ok(detail);
    }
}

#[tauri::command]
pub async fn get_league_entries(
    puuid: String,
    platform_routing: String,
    api_key: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://{}.api.riotgames.com/lol/league/v4/entries/by-puuid/{}",
        platform_routing.to_lowercase(),
        puuid
    );

    let res = client
        .get(&url)
        .header("X-Riot-Token", &api_key)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch league entries: {}", e))?;

    if !res.status().is_success() {
        return Ok(serde_json::json!([]));
    }

    let entries: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse league entries: {}", e))?;

    Ok(entries)
}

fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for byte in input.bytes() {
        match byte {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    encoded
}

