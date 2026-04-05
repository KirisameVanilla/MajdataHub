use crate::commands;
use crate::error::AppError;
use axum::{
    body::Body,
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use futures_util::StreamExt;
use rust_embed::Embed;
use serde::Deserialize;
use std::convert::Infallible;
use tokio_stream::wrappers::BroadcastStream;

#[derive(Embed)]
#[folder = "../dist/"]
struct Assets;

pub fn create_router() -> Router {
    Router::new()
        // 路径
        .route("/api/paths", get(get_app_paths))
        .route("/api/version", get(get_version))
        // 文件系统
        .route("/api/fs/exists", get(file_exists))
        .route("/api/fs/create-dir", post(create_directory))
        .route("/api/fs/bat-files", get(list_bat_files))
        .route("/api/fs/execute-bat", post(execute_bat_file))
        .route("/api/fs/read", get(read_file_content))
        .route("/api/fs/write", post(write_file_content))
        .route("/api/fs/pick-folder", post(pick_folder))
        // 游戏
        .route("/api/game/launch-options", get(get_launch_options))
        .route("/api/game/launch", post(launch_game))
        // 谱面
        .route("/api/charts/categories", get(list_chart_categories))
        .route("/api/charts/list", get(list_charts_in_category))
        .route("/api/charts/category", post(create_chart_category))
        .route("/api/charts/chart", delete(delete_chart))
        .route("/api/charts/move", post(move_chart))
        // 皮肤
        .route("/api/skins/list", get(list_skins))
        .route("/api/skins/skin", delete(delete_skin))
        // 校验和
        .route("/api/checksums/calculate", post(calculate_checksums))
        .route("/api/checksums/save", post(save_checksums_to_file))
        // ZIP
        .route("/api/zip/extract", post(extract_zip))
        .route("/api/zip/download-extract", post(download_and_extract))
        // 网络
        .route("/api/network/clear-cache", post(clear_api_cache))
        .route("/api/network/download-file", post(download_file_to_path))
        .route("/api/network/remote-hashes", post(fetch_remote_hashes))
        .route("/api/network/chart-list", post(fetch_chart_list))
        .route("/api/network/github-skins", post(fetch_github_skins))
        .route("/api/network/download-skin", post(download_skin_zip))
        .route(
            "/api/network/download-charts-batch",
            post(download_charts_batch),
        )
        // SSE 进度
        .route("/api/sse/file-progress", get(sse_file_progress))
        .route("/api/sse/batch-progress", get(sse_batch_progress))
        // 文件服务
        .route("/api/files/serve", get(serve_file))
        // SPA fallback 和静态文件 (使用 {*path} 语法捕获所有剩余路径)
        .route("/{*path}", get(static_handler))
        .fallback(get(static_handler_root))
}

// ============ 路径和版本 ============

async fn get_app_paths() -> Result<Json<commands::file_system::AppPaths>, AppError> {
    Ok(Json(commands::get_app_paths()?))
}

async fn get_version() -> Json<String> {
    Json(env!("CARGO_PKG_VERSION").to_string())
}

// ============ 文件系统 ============

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PathParam {
    path: String,
}

async fn file_exists(Query(param): Query<PathParam>) -> Result<Json<bool>, AppError> {
    Ok(Json(commands::file_exists(param.path)?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateDirParam {
    path: String,
}

async fn create_directory(Json(param): Json<CreateDirParam>) -> Result<Json<()>, AppError> {
    commands::create_directory(param.path)?;
    Ok(Json(()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DirParam {
    dir: String,
}

async fn list_bat_files(Query(param): Query<DirParam>) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(commands::list_bat_files(param.dir)?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecuteBatParam {
    dir_path: String,
    bat_file: String,
}

async fn execute_bat_file(Json(param): Json<ExecuteBatParam>) -> Result<Json<()>, AppError> {
    commands::execute_bat_file(param.dir_path, param.bat_file)?;
    Ok(Json(()))
}

async fn read_file_content(Query(param): Query<PathParam>) -> Result<Json<String>, AppError> {
    Ok(Json(commands::read_file_content(param.path)?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteFileParam {
    path: String,
    content: String,
}

async fn write_file_content(Json(param): Json<WriteFileParam>) -> Result<Json<()>, AppError> {
    commands::write_file_content(param.path, param.content)?;
    Ok(Json(()))
}

async fn pick_folder() -> Result<Json<String>, AppError> {
    let path = commands::pick_folder()?;
    Ok(Json(path))
}

// ============ 游戏 ============

async fn get_launch_options() -> Json<Vec<commands::file_system::LaunchOption>> {
    Json(commands::get_launch_options())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LaunchGameParam {
    game_dir: String,
    option_id: String,
}

async fn launch_game(Json(param): Json<LaunchGameParam>) -> Result<Json<()>, AppError> {
    commands::launch_game(param.game_dir, param.option_id)?;
    Ok(Json(()))
}

// ============ 谱面 ============

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MaichartsDirParam {
    maicharts_dir: String,
}

async fn list_chart_categories(
    Query(param): Query<MaichartsDirParam>,
) -> Result<Json<Vec<String>>, AppError> {
    Ok(Json(commands::list_chart_categories(param.maicharts_dir)?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChartsListParam {
    maicharts_dir: String,
    category: String,
}

async fn list_charts_in_category(
    Query(param): Query<ChartsListParam>,
) -> Result<Json<Vec<commands::file_system::ChartInfo>>, AppError> {
    Ok(Json(commands::list_charts_in_category(
        param.maicharts_dir,
        param.category,
    )?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateCategoryParam {
    maicharts_dir: String,
    category: String,
}

async fn create_chart_category(
    Json(param): Json<CreateCategoryParam>,
) -> Result<Json<()>, AppError> {
    commands::create_chart_category(param.maicharts_dir, param.category)?;
    Ok(Json(()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeleteChartParam {
    maicharts_dir: String,
    category: String,
    chart_name: String,
}

async fn delete_chart(Json(param): Json<DeleteChartParam>) -> Result<Json<()>, AppError> {
    commands::delete_chart(param.maicharts_dir, param.category, param.chart_name)?;
    Ok(Json(()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MoveChartParam {
    maicharts_dir: String,
    from_category: String,
    to_category: String,
    chart_name: String,
}

async fn move_chart(Json(param): Json<MoveChartParam>) -> Result<Json<()>, AppError> {
    commands::move_chart(
        param.maicharts_dir,
        param.from_category,
        param.to_category,
        param.chart_name,
    )?;
    Ok(Json(()))
}

// ============ 皮肤 ============

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkinsDirParam {
    skins_dir: String,
}

async fn list_skins(
    Query(param): Query<SkinsDirParam>,
) -> Result<Json<Vec<commands::file_system::SkinInfo>>, AppError> {
    Ok(Json(commands::list_skins(param.skins_dir)?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeleteSkinParam {
    skins_dir: String,
    skin_name: String,
}

async fn delete_skin(Json(param): Json<DeleteSkinParam>) -> Result<Json<()>, AppError> {
    commands::delete_skin(param.skins_dir, param.skin_name)?;
    Ok(Json(()))
}

// ============ 校验和 ============

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CalculateChecksumsParam {
    directory: String,
    exclude_files: Vec<String>,
}

async fn calculate_checksums(
    Json(param): Json<CalculateChecksumsParam>,
) -> Result<Json<Vec<crate::models::FileChecksum>>, AppError> {
    Ok(Json(
        commands::calculate_checksums(param.directory, param.exclude_files).await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveChecksumsParam {
    directory: String,
    output_file: String,
    exclude_files: Vec<String>,
}

async fn save_checksums_to_file(
    Json(param): Json<SaveChecksumsParam>,
) -> Result<Json<String>, AppError> {
    Ok(Json(
        commands::save_checksums_to_file(param.directory, param.output_file, param.exclude_files)
            .await?,
    ))
}

// ============ ZIP ============

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExtractZipParam {
    zip_path: String,
    target_dir: String,
}

async fn extract_zip(Json(param): Json<ExtractZipParam>) -> Result<Json<String>, AppError> {
    Ok(Json(commands::extract_zip(
        param.zip_path,
        param.target_dir,
    )?))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadExtractParam {
    url: String,
    target_path: String,
    zip_path: String,
    proxy: Option<String>,
}

async fn download_and_extract(
    Json(param): Json<DownloadExtractParam>,
) -> Result<Json<String>, AppError> {
    Ok(Json(
        commands::download_and_extract(param.url, param.target_path, param.zip_path, param.proxy)
            .await?,
    ))
}

// ============ 网络 ============

async fn clear_api_cache() -> Result<Json<()>, AppError> {
    commands::clear_api_cache()?;
    Ok(Json(()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadFileParam {
    url: String,
    file_path: String,
    target_dir: String,
    proxy: Option<String>,
}

async fn download_file_to_path(
    Json(param): Json<DownloadFileParam>,
) -> Result<Json<String>, AppError> {
    Ok(Json(
        commands::download_file_to_path(param.url, param.file_path, param.target_dir, param.proxy)
            .await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RemoteHashesParam {
    url: String,
    proxy: Option<String>,
}

async fn fetch_remote_hashes(
    Json(param): Json<RemoteHashesParam>,
) -> Result<Json<Vec<crate::models::FileChecksum>>, AppError> {
    Ok(Json(
        commands::fetch_remote_hashes(param.url, param.proxy).await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChartListParam {
    search: String,
    sort_type: i32,
    page: i32,
    proxy: Option<String>,
}

async fn fetch_chart_list(
    Json(param): Json<ChartListParam>,
) -> Result<Json<Vec<commands::network::ChartSummary>>, AppError> {
    Ok(Json(
        commands::fetch_chart_list(param.search, param.sort_type, param.page, param.proxy).await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GithubSkinsParam {
    url: String,
    base_url: String,
    proxy: Option<String>,
}

async fn fetch_github_skins(
    Json(param): Json<GithubSkinsParam>,
) -> Result<Json<Vec<commands::network::GithubSkin>>, AppError> {
    Ok(Json(
        commands::fetch_github_skins(param.url, param.base_url, param.proxy).await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadSkinParam {
    url: String,
    skin_name: String,
    skins_dir: String,
    proxy: Option<String>,
}

async fn download_skin_zip(Json(param): Json<DownloadSkinParam>) -> Result<Json<String>, AppError> {
    Ok(Json(
        commands::download_skin_zip(param.url, param.skin_name, param.skins_dir, param.proxy)
            .await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadBatchParam {
    chart_ids: Vec<String>,
    chart_titles: Vec<String>,
    maicharts_dir: String,
    category: String,
    proxy: Option<String>,
}

async fn download_charts_batch(
    Json(param): Json<DownloadBatchParam>,
) -> Result<Json<String>, AppError> {
    Ok(Json(
        commands::download_charts_batch(
            param.chart_ids,
            param.chart_titles,
            param.maicharts_dir,
            param.category,
            param.proxy,
        )
        .await?,
    ))
}

// ============ SSE 进度 ============

async fn sse_file_progress() -> impl IntoResponse {
    let rx = crate::sse::get_file_progress_tx().subscribe();
    let stream = BroadcastStream::new(rx).map(|msg| {
        let data = match msg {
            Ok(progress) => serde_json::to_string(&progress).unwrap_or_default(),
            Err(_) => String::new(),
        };
        Ok::<_, Infallible>(format!("data: {}\n\n", data))
    });

    Response::builder()
        .header("Content-Type", "text/event-stream")
        .header("Cache-Control", "no-cache")
        .header("Connection", "keep-alive")
        .body(Body::from_stream(stream))
        .unwrap()
}

async fn sse_batch_progress() -> impl IntoResponse {
    let rx = crate::sse::get_batch_progress_tx().subscribe();
    let stream = BroadcastStream::new(rx).map(|msg| {
        let data = match msg {
            Ok(progress) => serde_json::to_string(&progress).unwrap_or_default(),
            Err(_) => String::new(),
        };
        Ok::<_, Infallible>(format!("data: {}\n\n", data))
    });

    Response::builder()
        .header("Content-Type", "text/event-stream")
        .header("Cache-Control", "no-cache")
        .header("Connection", "keep-alive")
        .body(Body::from_stream(stream))
        .unwrap()
}

// ============ 文件服务 ============

async fn serve_file(Query(param): Query<PathParam>) -> impl IntoResponse {
    let path = std::path::Path::new(&param.path);

    if !path.exists() {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    }

    match tokio::fs::read(path).await {
        Ok(bytes) => {
            let mime = mime_guess::from_path(path)
                .first_or_octet_stream()
                .to_string();
            (StatusCode::OK, [("Content-Type", mime.as_str())], bytes).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read file").into_response(),
    }
}

// ============ 静态文件和 SPA fallback ============

async fn static_handler_root() -> impl IntoResponse {
    match Assets::get("index.html") {
        Some(content) => (
            StatusCode::OK,
            [("Content-Type", "text/html; charset=utf-8")],
            content.data.to_vec(),
        )
            .into_response(),
        None => (
            StatusCode::NOT_FOUND,
            "Frontend not built. Run `pnpm vite:build` first.",
        )
            .into_response(),
    }
}

async fn static_handler(
    axum::extract::Path(path): axum::extract::Path<String>,
) -> impl IntoResponse {
    // 如果请求的是 API 路径，返回 404
    if path.starts_with("api/") {
        return (StatusCode::NOT_FOUND, "Not Found").into_response();
    }

    // 尝试从嵌入的资源中获取文件
    if let Some(content) = Assets::get(&path) {
        let mime = mime_guess::from_path(&path)
            .first_or_octet_stream()
            .to_string();
        return (
            StatusCode::OK,
            [("Content-Type", mime.as_str())],
            content.data.to_vec(),
        )
            .into_response();
    }

    // SPA fallback: 返回 index.html
    match Assets::get("index.html") {
        Some(content) => (
            StatusCode::OK,
            [("Content-Type", "text/html; charset=utf-8")],
            content.data.to_vec(),
        )
            .into_response(),
        None => (
            StatusCode::NOT_FOUND,
            "Frontend not built. Run `pnpm vite:build` first.",
        )
            .into_response(),
    }
}
