// 模块声明
mod commands;
mod error;
mod models;
mod routes;
mod sse;

use std::fs::OpenOptions;
use std::io::Write;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// 简单的线程安全文件写入器包装
#[derive(Clone)]
struct FileWriter {
    file: std::sync::Arc<std::sync::Mutex<std::fs::File>>,
}

impl FileWriter {
    fn new(file: std::fs::File) -> Self {
        Self {
            file: std::sync::Arc::new(std::sync::Mutex::new(file)),
        }
    }
}

impl Write for FileWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.file.lock().unwrap().write(buf)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.file.lock().unwrap().flush()
    }
}

/// 初始化日志系统
fn init_logging() {
    let exe_path = std::env::current_exe().ok();
    let log_dir = exe_path
        .as_ref()
        .and_then(|p| p.parent())
        .unwrap_or_else(|| std::path::Path::new("."));

    let log_file_path = log_dir.join("MajdataHub.log");

    let log_file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&log_file_path)
        .expect("无法创建日志文件");

    let file_writer = FileWriter::new(log_file);

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(
            fmt::layer()
                .with_writer(move || file_writer.clone())
                .with_target(true)
                .with_thread_ids(false)
                .with_file(true)
                .with_line_number(true)
                .with_ansi(false),
        )
        .with(
            fmt::layer()
                .with_writer(std::io::stdout)
                .with_target(true)
                .with_thread_ids(false)
                .with_file(true)
                .with_line_number(true)
                .with_ansi(true),
        )
        .init();

    tracing::info!("日志系统已初始化，日志文件: {:?}", log_file_path);
}

/// 应用程序入口
pub fn run() {
    init_logging();

    tracing::info!("启动 Majdata Hub 服务器");

    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Failed to create Tokio runtime");

    rt.block_on(async {
        let app = routes::create_router();

        let listener = tokio::net::TcpListener::bind("127.0.0.1:1420")
            .await
            .expect("Failed to bind to 127.0.0.1:1420");

        let addr = "http://127.0.0.1:1420";
        tracing::info!("服务器运行于 {}", addr);

        // 自动打开浏览器
        let _ = open::that(addr);

        axum::serve(listener, app)
            .await
            .expect("Failed to start server");
    });
}
