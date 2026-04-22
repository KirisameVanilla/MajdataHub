use serde::Serialize;
use std::sync::OnceLock;
use tokio::sync::broadcast;

/// 文件下载进度事件
#[derive(Debug, Clone, Serialize)]
pub struct DownloadFileProgress {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub speed: f64,
}

/// 批量下载进度事件
#[derive(Debug, Clone, Serialize)]
pub struct DownloadBatchProgress {
    pub current: usize,
    pub total: usize,
    pub chart_title: String,
}

static FILE_PROGRESS_TX: OnceLock<broadcast::Sender<DownloadFileProgress>> = OnceLock::new();
static BATCH_PROGRESS_TX: OnceLock<broadcast::Sender<DownloadBatchProgress>> = OnceLock::new();

pub fn get_file_progress_tx() -> &'static broadcast::Sender<DownloadFileProgress> {
    FILE_PROGRESS_TX.get_or_init(|| {
        let (tx, _) = broadcast::channel(100);
        tx
    })
}

pub fn get_batch_progress_tx() -> &'static broadcast::Sender<DownloadBatchProgress> {
    BATCH_PROGRESS_TX.get_or_init(|| {
        let (tx, _) = broadcast::channel(100);
        tx
    })
}

/// 更新下载进度事件
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub speed: f64,
    /// 状态: "downloading" | "ready" | "failed"
    pub status: String,
    pub error: Option<String>,
}

static UPDATE_PROGRESS_TX: OnceLock<broadcast::Sender<UpdateProgress>> = OnceLock::new();

pub fn get_update_progress_tx() -> &'static broadcast::Sender<UpdateProgress> {
    UPDATE_PROGRESS_TX.get_or_init(|| {
        let (tx, _) = broadcast::channel(100);
        tx
    })
}
