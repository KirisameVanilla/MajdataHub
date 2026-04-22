use crate::sse::UpdateProgress;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;

/// GitHub Releases API 响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubRelease {
    pub tag_name: String,
    pub body: Option<String>,
    pub assets: Vec<GithubAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
}

/// 版本检查响应
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: String,
    pub release_notes: Option<String>,
    pub download_url_github: Option<String>,
    pub download_url_cnb: Option<String>,
    pub file_size: u64,
}

const GITHUB_API_URL: &str =
    "https://api.github.com/repos/KirisameVanilla/MajdataHub/releases/latest";
const CNB_BASE_URL: &str = "https://cnb.cool/TeamMajdata/MajdataHub-Build/-/git/raw/main/";

/// 检查是否有更新
pub async fn check_for_update(proxy: Option<String>) -> Result<UpdateInfo, String> {
    let client = super::network::create_http_client(proxy)?;

    let response = client
        .get(GITHUB_API_URL)
        .header("User-Agent", "MajdataHub-Updater")
        .send()
        .await
        .map_err(|e| format!("检查更新失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API 返回错误: {}", response.status()));
    }

    let release: GithubRelease = response
        .json()
        .await
        .map_err(|e| format!("解析 GitHub 响应失败: {}", e))?;

    // 从 tag_name 提取版本号（去掉前缀 v）
    let latest_version = release
        .tag_name
        .strip_prefix('v')
        .unwrap_or(&release.tag_name)
        .to_string();

    let current_version = env!("CARGO_PKG_VERSION").to_string();

    // 用 semver 比较版本
    let current = semver::Version::parse(&current_version)
        .map_err(|e| format!("当前版本号解析失败: {}", e))?;
    let latest = semver::Version::parse(&latest_version)
        .map_err(|e| format!("远程版本号解析失败: {}", e))?;

    let has_update = latest > current;

    // 查找 exe 资产
    let asset_name = format!("majdata-hub-v{}.exe", latest_version);
    let asset = release.assets.iter().find(|a| a.name == asset_name);

    let (download_url_github, file_size) = match asset {
        Some(a) => (Some(a.browser_download_url.clone()), a.size),
        None => (None, 0),
    };

    // 构造 CNB URL
    let download_url_cnb = if has_update {
        Some(format!(
            "{}majdata-hub-v{}.exe?download=true",
            CNB_BASE_URL, latest_version
        ))
    } else {
        None
    };

    tracing::info!(
        "更新检查: 当前={}, 最新={}, 有更新={}",
        current_version,
        latest_version,
        has_update
    );

    Ok(UpdateInfo {
        has_update,
        current_version,
        latest_version,
        release_notes: release.body,
        download_url_github,
        download_url_cnb,
        file_size,
    })
}

/// 下载更新到 majdata-hub.new.exe
pub async fn download_update(
    download_url: String,
    proxy: Option<String>,
) -> Result<String, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("获取 exe 路径失败: {}", e))?
        .parent()
        .ok_or("无法确定 exe 所在目录")?
        .to_path_buf();

    let output_path = exe_dir.join("majdata-hub.new.exe");
    let tx = crate::sse::get_update_progress_tx();

    let _ = tx.send(UpdateProgress {
        downloaded: 0,
        total: None,
        speed: 0.0,
        status: "downloading".into(),
        error: None,
    });

    let client = super::network::create_http_client(proxy)?;
    let response = client.get(&download_url).send().await.map_err(|e| {
        let _ = tx.send(UpdateProgress {
            downloaded: 0,
            total: None,
            speed: 0.0,
            status: "failed".into(),
            error: Some(format!("{}", e)),
        });
        format!("下载失败: {}", e)
    })?;

    if !response.status().is_success() {
        let _ = tx.send(UpdateProgress {
            downloaded: 0,
            total: None,
            speed: 0.0,
            status: "failed".into(),
            error: Some(format!("HTTP {}", response.status())),
        });
        return Err(format!("下载失败，HTTP 状态码: {}", response.status()));
    }

    let total_size = response.content_length();
    let mut downloaded: u64 = 0;
    let mut file = tokio::fs::File::create(&output_path)
        .await
        .map_err(|e| format!("无法创建文件: {}", e))?;

    let mut stream = response.bytes_stream();
    let mut last_emit = std::time::Instant::now();
    let mut last_downloaded: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| {
            let _ = tx.send(UpdateProgress {
                downloaded,
                total: total_size,
                speed: 0.0,
                status: "failed".into(),
                error: Some(format!("{}", e)),
            });
            format!("流读取错误: {}", e)
        })?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("写入文件错误: {}", e))?;
        downloaded += chunk.len() as u64;

        let now = std::time::Instant::now();
        if now.duration_since(last_emit).as_millis() >= 200 {
            let elapsed = now.duration_since(last_emit).as_secs_f64();
            let speed = if elapsed > 0.0 {
                (downloaded - last_downloaded) as f64 / elapsed
            } else {
                0.0
            };
            last_downloaded = downloaded;
            last_emit = now;
            let _ = tx.send(UpdateProgress {
                downloaded,
                total: total_size,
                speed,
                status: "downloading".into(),
                error: None,
            });
        }
    }

    file.flush()
        .await
        .map_err(|e| format!("刷新文件缓冲失败: {}", e))?;
    drop(file);

    let _ = tx.send(UpdateProgress {
        downloaded,
        total: total_size,
        speed: 0.0,
        status: "ready".into(),
        error: None,
    });

    tracing::info!("更新下载完成: {} 字节", downloaded);
    Ok(output_path.to_string_lossy().to_string())
}

/// 应用更新：创建 bat 脚本替换 exe 并退出
pub fn apply_update() -> Result<(), String> {
    let exe_path = std::env::current_exe().map_err(|e| format!("获取 exe 路径失败: {}", e))?;
    let exe_dir = exe_path.parent().ok_or("无法确定 exe 所在目录")?;

    let new_exe = exe_dir.join("majdata-hub.new.exe");
    if !new_exe.exists() {
        return Err("更新文件不存在".to_string());
    }

    // 使用 %~dp0 (bat 脚本自身所在目录) 引用文件路径，比硬编码绝对路径更可靠
    let script_content = format!(
        r#"@echo off
cd /d "%~dp0"
taskkill /f /im majdata-hub.exe
timeout /t 1
copy /Y "%~dp0majdata-hub.new.exe" "%~dp0majdata-hub.exe"
timeout /t 1
del "%~dp0majdata-hub.new.exe"
start majdata-hub.exe
"#,
    );

    let script_path = exe_dir.join("apply_update.bat");
    std::fs::write(&script_path, &script_content)
        .map_err(|e| format!("写入更新脚本失败: {}", e))?;

    // 启动 bat 脚本（分离进程，无窗口）
    #[cfg(target_os = "windows")]
    {
        tracing::info!("启动 bat 脚本应用更新: {:?}", script_path);
        use std::os::windows::process::CommandExt;
        const CREATE_NEW_CONSOLE: u32 = 0x00000010;
        std::process::Command::new("cmd.exe")
            .args(["/C", script_path.to_str().unwrap()])
            .creation_flags(CREATE_NEW_CONSOLE)
            .spawn()
            .map_err(|e| format!("启动更新脚本失败: {}", e))?;
    }

    tracing::info!("更新已应用，正在退出以完成替换...");
    Ok(())
}

/// 清理上次更新残留文件
pub fn cleanup_update_files() -> Result<(), String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("获取 exe 路径失败: {}", e))?
        .parent()
        .ok_or("无法确定 exe 所在目录")?
        .to_path_buf();

    let new_exe = exe_dir.join("majdata-hub.new.exe");
    if new_exe.exists() {
        tracing::info!("清理残留更新文件: {:?}", new_exe);
        let _ = std::fs::remove_file(&new_exe);
    }

    let bat = exe_dir.join("apply_update.bat");
    if bat.exists() {
        tracing::info!("清理残留更新脚本: {:?}", bat);
        let _ = std::fs::remove_file(&bat);
    }

    Ok(())
}
