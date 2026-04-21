use rfd::FileDialog;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

/// 游戏启动选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchOption {
    pub id: String,
    pub label: String,
    pub description: String,
}

/// 谱面信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartInfo {
    pub name: String,
    pub category: String,
    pub has_bg: bool,
    pub has_track: bool,
    pub has_maidata: bool,
    pub has_video: bool,
}

/// 皮肤信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkinInfo {
    pub name: String,
}

/// 应用程序路径
#[derive(Debug, Clone, Serialize)]
pub struct AppPaths {
    pub exe_path: String,
    pub exe_folder_path: String,
    pub game_folder_path: String,
    pub maicharts_path: String,
    pub skins_path: String,
}

/// 获取应用程序路径集合
pub fn get_app_paths() -> Result<AppPaths, String> {
    let exe_path =
        env::current_exe().map_err(|e| format!("Failed to get executable path: {}", e))?;
    let exe_str = exe_path
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    let exe_folder = exe_path
        .parent()
        .and_then(|p| p.to_str())
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    let game_folder = Path::new(&exe_folder).join("game");
    let game_folder_path = game_folder
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    let maicharts_path = game_folder
        .join("MaiCharts")
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    let skins_path = game_folder
        .join("Skins")
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    Ok(AppPaths {
        exe_path: exe_str,
        exe_folder_path: exe_folder,
        game_folder_path,
        maicharts_path,
        skins_path,
    })
}

/// 检查文件是否存在
pub fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// 获取游戏启动选项列表（内置）
pub fn get_launch_options() -> Vec<LaunchOption> {
    vec![
        LaunchOption {
            id: "default".to_string(),
            label: "默认启动".to_string(),
            description: "使用默认设置启动游戏".to_string(),
        },
        LaunchOption {
            id: "d3d11".to_string(),
            label: "强制使用 D3D11".to_string(),
            description: "强制使用 Direct3D 11 渲染".to_string(),
        },
        LaunchOption {
            id: "d3d12".to_string(),
            label: "强制使用 D3D12".to_string(),
            description: "强制使用 Direct3D 12 渲染".to_string(),
        },
        LaunchOption {
            id: "opengl".to_string(),
            label: "强制使用 OpenGL".to_string(),
            description: "强制使用 OpenGL Core 渲染".to_string(),
        },
        LaunchOption {
            id: "vulkan".to_string(),
            label: "强制使用 Vulkan".to_string(),
            description: "强制使用 Vulkan 渲染".to_string(),
        },
        LaunchOption {
            id: "test".to_string(),
            label: "测试模式".to_string(),
            description: "进入游戏测试模式".to_string(),
        },
        LaunchOption {
            id: "edit".to_string(),
            label: "MajdataEdit".to_string(),
            description: "打开谱面编辑器".to_string(),
        },
    ]
}

/// 根据启动选项ID启动游戏
pub fn launch_game(game_dir: String, option_id: String) -> Result<(), String> {
    tracing::info!(
        "准备启动游戏，游戏目录: {}，启动选项: {}",
        game_dir,
        option_id
    );

    let game_exe = Path::new(&game_dir).join("MajdataPlay.exe");

    if !game_exe.exists() {
        tracing::error!("游戏程序不存在: {:?}", game_exe);
        return Err(format!("游戏程序不存在: {}", game_exe.display()));
    }

    #[cfg(target_os = "windows")]
    {
        let args: Vec<&str> = match option_id.as_str() {
            "default" => vec![],
            "d3d11" => vec!["-force-d3d11"],
            "d3d12" => vec!["-force-d3d12"],
            "opengl" => vec!["-force-glcore"],
            "vulkan" => vec!["-force-vulkan"],
            "test" => vec!["--test-mode"],
            "edit" => vec!["--view-mode"],
            _ => {
                tracing::error!("未知的启动选项: {}", option_id);
                return Err(format!("未知的启动选项: {}", option_id));
            }
        };

        tracing::info!("使用参数启动游戏: {:?}", args);

        match Command::new(&game_exe)
            .args(&args)
            .current_dir(&game_dir)
            .spawn()
        {
            Ok(_) => {
                tracing::info!("游戏启动成功");
                Ok(())
            }
            Err(e) => {
                tracing::error!("启动游戏失败: {}", e);
                Err(format!("启动游戏失败: {}", e))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("此功能仅在 Windows 上可用".to_string())
    }
}

/// 列出指定目录下的所有 .bat 文件（已弃用，保留用于兼容）
pub fn list_bat_files(dir_path: String) -> Result<Vec<String>, String> {
    let path = Path::new(&dir_path);

    if !path.exists() {
        return Err(format!("目录不存在: {}", dir_path));
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", dir_path));
    }

    let mut bat_files = Vec::new();

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    if let Some(filename) = entry.file_name().to_str() {
                        if filename.ends_with(".bat") {
                            bat_files.push(filename.to_string());
                        }
                    }
                }
            }
        }
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    }

    bat_files.sort();
    Ok(bat_files)
}

/// 执行指定的 .bat 文件（已弃用，保留用于兼容）
pub fn execute_bat_file(dir_path: String, bat_file: String) -> Result<(), String> {
    tracing::info!("执行 BAT 文件: {}/{}", dir_path, bat_file);

    let bat_path = Path::new(&dir_path).join(&bat_file);

    if !bat_path.exists() {
        tracing::error!("BAT 文件不存在: {:?}", bat_path);
        return Err(format!("BAT 文件不存在: {}", bat_path.display()));
    }

    #[cfg(target_os = "windows")]
    {
        match Command::new("cmd")
            .args(&["/C", "start", "", bat_path.to_str().unwrap()])
            .current_dir(&dir_path)
            .spawn()
        {
            Ok(_) => {
                tracing::info!("BAT 文件执行成功");
                Ok(())
            }
            Err(e) => {
                tracing::error!("执行 BAT 文件失败: {}", e);
                Err(format!("执行 BAT 文件失败: {}", e))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("此功能仅在 Windows 上可用".to_string())
    }
}

/// 列出所有谱面分类
pub fn list_chart_categories(maicharts_dir: String) -> Result<Vec<String>, String> {
    let path = Path::new(&maicharts_dir);

    if !path.exists() {
        return Ok(Vec::new());
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", maicharts_dir));
    }

    let mut categories = Vec::new();

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    if entry.path().is_dir() {
                        if let Some(name) = entry.file_name().to_str() {
                            categories.push(name.to_string());
                        }
                    }
                }
            }
        }
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    }

    categories.sort();
    Ok(categories)
}

/// 列出某个分类下的所有谱面
pub fn list_charts_in_category(
    maicharts_dir: String,
    category: String,
) -> Result<Vec<ChartInfo>, String> {
    let category_path = Path::new(&maicharts_dir).join(&category);

    if !category_path.exists() {
        return Ok(Vec::new());
    }

    if !category_path.is_dir() {
        return Err(format!("分类路径不是目录: {}", category_path.display()));
    }

    let mut charts = Vec::new();

    match fs::read_dir(&category_path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    if entry.path().is_dir() {
                        if let Some(name) = entry.file_name().to_str() {
                            let chart_path = entry.path();

                            charts.push(ChartInfo {
                                name: name.to_string(),
                                category: category.clone(),
                                has_bg: chart_path.join("bg.jpg").exists()
                                    || chart_path.join("bg.png").exists(),
                                has_track: chart_path.join("track.mp3").exists()
                                    || chart_path.join("track.ogg").exists(),
                                has_maidata: chart_path.join("maidata.txt").exists(),
                                has_video: chart_path.join("pv.mp4").exists()
                                    || chart_path.join("bg.mp4").exists(),
                            });
                        }
                    }
                }
            }
        }
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    }

    charts.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(charts)
}

/// 删除谱面
pub fn delete_chart(
    maicharts_dir: String,
    category: String,
    chart_name: String,
) -> Result<(), String> {
    let chart_path = Path::new(&maicharts_dir).join(&category).join(&chart_name);

    if !chart_path.exists() {
        return Err(format!("谱面不存在: {}", chart_path.display()));
    }

    if !chart_path.is_dir() {
        return Err(format!("路径不是目录: {}", chart_path.display()));
    }

    match fs::remove_dir_all(&chart_path) {
        Ok(_) => {
            tracing::info!("删除谱面成功: {:?}", chart_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("删除谱面失败: {}", e);
            Err(format!("删除谱面失败: {}", e))
        }
    }
}

/// 移动谱面到另一个分类
pub fn move_chart(
    maicharts_dir: String,
    from_category: String,
    to_category: String,
    chart_name: String,
) -> Result<(), String> {
    let from_path = Path::new(&maicharts_dir)
        .join(&from_category)
        .join(&chart_name);
    let to_category_path = Path::new(&maicharts_dir).join(&to_category);
    let to_path = to_category_path.join(&chart_name);

    if !from_path.exists() {
        return Err(format!("源谱面不存在: {}", from_path.display()));
    }

    // 确保目标分类存在
    if !to_category_path.exists() {
        fs::create_dir_all(&to_category_path).map_err(|e| format!("创建目标分类失败: {}", e))?;
    }

    // 检查目标位置是否已存在同名谱面
    if to_path.exists() {
        return Err(format!("目标位置已存在同名谱面: {}", to_path.display()));
    }

    match fs::rename(&from_path, &to_path) {
        Ok(_) => {
            tracing::info!("移动谱面成功: {:?} -> {:?}", from_path, to_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("移动谱面失败: {}", e);
            Err(format!("移动谱面失败: {}", e))
        }
    }
}

/// 创建新的谱面分类
pub fn create_chart_category(maicharts_dir: String, category: String) -> Result<(), String> {
    let category_path = Path::new(&maicharts_dir).join(&category);

    if category_path.exists() {
        return Err(format!("分类已存在: {}", category));
    }

    match fs::create_dir_all(&category_path) {
        Ok(_) => {
            tracing::info!("创建分类成功: {:?}", category_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("创建分类失败: {}", e);
            Err(format!("创建分类失败: {}", e))
        }
    }
}

/// 创建目录
pub fn create_directory(path: String) -> Result<(), String> {
    let dir_path = Path::new(&path);

    match fs::create_dir_all(&dir_path) {
        Ok(_) => {
            tracing::info!("创建目录成功: {:?}", dir_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("创建目录失败: {}", e);
            Err(format!("创建目录失败: {}", e))
        }
    }
}

/// 列出所有皮肤
pub fn list_skins(skins_dir: String) -> Result<Vec<SkinInfo>, String> {
    let path = Path::new(&skins_dir);

    if !path.exists() {
        // 如果目录不存在，尝试创建
        fs::create_dir_all(path).map_err(|e| format!("创建皮肤目录失败: {}", e))?;
        return Ok(Vec::new());
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", skins_dir));
    }

    let mut skins = Vec::new();

    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    let entry_path = entry.path();
                    if entry_path.is_dir() {
                        if let Some(name) = entry.file_name().to_str() {
                            skins.push(SkinInfo {
                                name: name.to_string(),
                            });
                        }
                    }
                }
            }
        }
        Err(e) => return Err(format!("读取目录失败: {}", e)),
    }

    skins.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skins)
}

/// 删除皮肤
pub fn delete_skin(skins_dir: String, skin_name: String) -> Result<(), String> {
    let skin_path = Path::new(&skins_dir).join(&skin_name);

    if !skin_path.exists() {
        return Err(format!("皮肤不存在: {}", skin_path.display()));
    }

    if !skin_path.is_dir() {
        return Err(format!("路径不是目录: {}", skin_path.display()));
    }

    match fs::remove_dir_all(&skin_path) {
        Ok(_) => {
            tracing::info!("删除皮肤成功: {:?}", skin_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("删除皮肤失败: {}", e);
            Err(format!("删除皮肤失败: {}", e))
        }
    }
}

/// 读取文件内容
pub fn read_file_content(path: String) -> Result<String, String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("文件不存在: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("路径不是文件: {}", path));
    }

    match fs::read_to_string(file_path) {
        Ok(content) => {
            tracing::info!("成功读取文件: {:?}", file_path);
            Ok(content)
        }
        Err(e) => {
            tracing::error!("读取文件失败: {}", e);
            Err(format!("读取文件失败: {}", e))
        }
    }
}

/// 写入文件内容
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    // 确保父目录存在
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("创建父目录失败: {}", e))?;
        }
    }

    match fs::write(file_path, content) {
        Ok(_) => {
            tracing::info!("成功写入文件: {:?}", file_path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("写入文件失败: {}", e);
            Err(format!("写入文件失败: {}", e))
        }
    }
}

/// 打开文件夹选择对话框
pub fn pick_folder() -> Result<String, String> {
    let path = FileDialog::new().pick_folder();

    match path {
        Some(folder_path) => {
            let path_str = folder_path
                .to_str()
                .ok_or_else(|| "Invalid path encoding".to_string())?
                .to_string();
            tracing::info!("用户选择的文件夹: {}", path_str);
            Ok(path_str)
        }
        None => Err("用户取消了文件夹选择".to_string()),
    }
}

/// 打开文件选择对话框（支持多选）
pub fn pick_files() -> Result<Vec<String>, String> {
    let paths = FileDialog::new()
        .add_filter("ZIP 压缩包", &["zip"])
        .pick_files();

    match paths {
        Some(file_paths) => {
            let path_strs: Vec<String> = file_paths
                .iter()
                .filter_map(|p| p.to_str().map(|s| s.to_string()))
                .collect();
            tracing::info!("用户选择了 {} 个文件", path_strs.len());
            Ok(path_strs)
        }
        None => Err("用户取消了文件选择".to_string()),
    }
}

/// 谱面导入结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub file_name: String,
    /// "imported" | "skipped" | "failed"
    pub status: String,
    pub chart_name: Option<String>,
    pub reason: Option<String>,
}

/// 批量导入谱面 ZIP 文件
pub fn import_chart_zips(
    zip_paths: Vec<String>,
    maicharts_dir: String,
    category: String,
) -> Result<Vec<ImportResult>, String> {
    let category_path = Path::new(&maicharts_dir).join(&category);

    if !category_path.exists() {
        fs::create_dir_all(&category_path).map_err(|e| format!("创建分类目录失败: {}", e))?;
    }

    let mut results = Vec::new();

    for zip_path_str in &zip_paths {
        let zip_path = Path::new(zip_path_str);
        let file_name = zip_path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();

        tracing::info!("正在处理: {}", file_name);

        // 创建临时目录
        let temp_dir = match create_temp_dir() {
            Ok(dir) => dir,
            Err(e) => {
                results.push(ImportResult {
                    file_name: file_name.clone(),
                    status: "failed".to_string(),
                    chart_name: None,
                    reason: Some(format!("创建临时目录失败: {}", e)),
                });
                continue;
            }
        };

        // 解压 ZIP（保留目录结构）
        if let Err(e) = extract_zip_raw(zip_path, &temp_dir) {
            let _ = fs::remove_dir_all(&temp_dir);
            results.push(ImportResult {
                file_name: file_name.clone(),
                status: "failed".to_string(),
                chart_name: None,
                reason: Some(format!("解压失败: {}", e)),
            });
            continue;
        }

        // 查找包含 maidata.txt 的目录
        let chart_folder = find_chart_folder(&temp_dir);

        let Some(chart_folder) = chart_folder else {
            let _ = fs::remove_dir_all(&temp_dir);
            results.push(ImportResult {
                file_name: file_name.clone(),
                status: "skipped".to_string(),
                chart_name: None,
                reason: Some("ZIP 中未找到包含 maidata.txt 的目录".to_string()),
            });
            continue;
        };

        // 验证必要文件
        let has_maidata = chart_folder.join("maidata.txt").exists();
        let has_track = has_track_file(&chart_folder);

        if !has_maidata || !has_track {
            let _ = fs::remove_dir_all(&temp_dir);
            let missing_parts = if !has_maidata && !has_track {
                "maidata.txt、track.*".to_string()
            } else if !has_maidata {
                "maidata.txt".to_string()
            } else {
                "track.*".to_string()
            };
            results.push(ImportResult {
                file_name: file_name.clone(),
                status: "skipped".to_string(),
                chart_name: None,
                reason: Some(format!("缺少必要文件: {}", missing_parts)),
            });
            continue;
        }

        // 确定谱面名称
        let chart_name = if chart_folder == temp_dir {
            // 文件直接在根目录，使用 ZIP 文件名
            zip_file_name_to_chart_name(&file_name)
        } else {
            chart_folder
                .file_name()
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| zip_file_name_to_chart_name(&file_name))
        };

        let target_path = category_path.join(&chart_name);

        if target_path.exists() {
            let _ = fs::remove_dir_all(&temp_dir);
            results.push(ImportResult {
                file_name: file_name.clone(),
                status: "skipped".to_string(),
                chart_name: Some(chart_name),
                reason: Some("目标位置已存在同名谱面".to_string()),
            });
            continue;
        }

        // 移动到目标分类
        match fs::rename(&chart_folder, &target_path) {
            Ok(_) => {
                tracing::info!("导入谱面成功: {} -> {:?}", chart_name, target_path);
                let _ = fs::remove_dir_all(&temp_dir);
                results.push(ImportResult {
                    file_name,
                    status: "imported".to_string(),
                    chart_name: Some(chart_name),
                    reason: None,
                });
            }
            Err(_) => {
                // rename 可能跨驱动器失败，尝试 copy + delete
                match copy_dir_recursive(&chart_folder, &target_path) {
                    Ok(_) => {
                        tracing::info!("导入谱面成功（复制）: {} -> {:?}", chart_name, target_path);
                        let _ = fs::remove_dir_all(&temp_dir);
                        results.push(ImportResult {
                            file_name,
                            status: "imported".to_string(),
                            chart_name: Some(chart_name),
                            reason: None,
                        });
                    }
                    Err(copy_err) => {
                        tracing::error!("移动/复制谱面失败: {}", copy_err);
                        let _ = fs::remove_dir_all(&temp_dir);
                        results.push(ImportResult {
                            file_name,
                            status: "failed".to_string(),
                            chart_name: Some(chart_name),
                            reason: Some(format!("移动文件失败: {}", copy_err)),
                        });
                    }
                }
            }
        }
    }

    Ok(results)
}

/// 创建临时目录
fn create_temp_dir() -> Result<PathBuf, String> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let temp_dir = env::temp_dir().join(format!("majdata_import_{}", timestamp));
    fs::create_dir_all(&temp_dir).map_err(|e| format!("创建临时目录失败: {}", e))?;
    Ok(temp_dir)
}

/// 查找包含 maidata.txt 的目录
fn find_chart_folder(dir: &Path) -> Option<PathBuf> {
    // 检查目录本身
    if dir.join("maidata.txt").exists() {
        return Some(dir.to_path_buf());
    }

    // 检查子目录（最多 2 层）
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() && entry.path().join("maidata.txt").exists() {
                return Some(entry.path());
            }
        }
    }

    // 再检查第二层
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                if let Ok(sub_entries) = fs::read_dir(&entry.path()) {
                    for sub_entry in sub_entries.flatten() {
                        if sub_entry.path().is_dir()
                            && sub_entry.path().join("maidata.txt").exists()
                        {
                            return Some(sub_entry.path());
                        }
                    }
                }
            }
        }
    }

    None
}

/// 检查目录中是否包含 track.* 文件
fn has_track_file(dir: &Path) -> bool {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.starts_with("track.") && entry.path().is_file() {
                    return true;
                }
            }
        }
    }
    false
}

/// 将 ZIP 文件名转换为谱面名称
fn zip_file_name_to_chart_name(zip_name: &str) -> String {
    zip_name
        .strip_suffix(".zip")
        .unwrap_or(zip_name)
        .to_string()
}

/// 解压 ZIP 文件（保留目录结构，不剥离根目录）
fn extract_zip_raw(zip_path: &Path, target_dir: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| format!("打开 ZIP 文件失败: {}", e))?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("读取 ZIP 文件失败: {}", e))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("读取 ZIP 条目失败: {}", e))?;

        let entry_path = entry.name();

        // 跳过绝对路径和路径遍历
        if entry_path.starts_with('/') || entry_path.contains("..") {
            continue;
        }

        let outpath = target_dir.join(entry_path);

        if entry.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| format!("创建目录失败: {}", e))?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent).map_err(|e| format!("创建父目录失败: {}", e))?;
            }
            let mut outfile =
                fs::File::create(&outpath).map_err(|e| format!("创建文件失败: {}", e))?;
            io::copy(&mut entry, &mut outfile).map_err(|e| format!("解压文件失败: {}", e))?;
        }
    }

    Ok(())
}

/// 递归复制目录
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    if !dst.exists() {
        fs::create_dir_all(dst).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    for entry in fs::read_dir(src).map_err(|e| format!("读取目录失败: {}", e))? {
        let entry = entry.map_err(|e| format!("读取目录条目失败: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| format!("复制文件失败: {}", e))?;
        }
    }

    Ok(())
}
