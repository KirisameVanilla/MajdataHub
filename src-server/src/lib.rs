// 模块声明
mod commands;
mod error;
mod models;
mod routes;
mod sse;

use std::backtrace::Backtrace;
use std::fs::OpenOptions;
use std::io::ErrorKind;
use std::io::Write;
use std::path::PathBuf;
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
fn init_logging() -> PathBuf {
    let exe_path = std::env::current_exe().ok();
    let log_dir = exe_path
        .as_ref()
        .and_then(|p| p.parent())
        .unwrap_or_else(|| std::path::Path::new("."));

    let log_file_path = log_dir.join("MajdataHub.log");
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .ok();

    let file_writer = log_file.map(FileWriter::new);
    let file_layer = file_writer.map(|writer| {
        fmt::layer()
            .with_writer(move || writer.clone())
            .with_target(true)
            .with_thread_ids(false)
            .with_file(true)
            .with_line_number(true)
            .with_ansi(false)
    });

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(file_layer)
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
    log_file_path
}

fn install_panic_hook(log_file_path: PathBuf) {
    std::panic::set_hook(Box::new(move |info| {
        let location = info
            .location()
            .map(|loc| format!("{}:{}", loc.file(), loc.line()))
            .unwrap_or_else(|| "unknown".to_string());

        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "non-string panic payload".to_string()
        };

        let backtrace = Backtrace::force_capture();

        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file_path)
        {
            let _ = writeln!(
                file,
                "PANIC at {}: {}\nBacktrace:\n{}",
                location, payload, backtrace
            );
        }

        tracing::error!(
            "PANIC at {}: {}\nBacktrace:\n{}",
            location,
            payload,
            backtrace
        );
    }));
}

async fn bind_listener() -> Result<(tokio::net::TcpListener, String), String> {
    let default_addr = "127.0.0.1:1421";

    match tokio::net::TcpListener::bind(default_addr).await {
        Ok(listener) => {
            let addr = listener
                .local_addr()
                .map_err(|e| format!("获取监听地址失败: {e}"))?;
            Ok((listener, format!("http://{}", addr)))
        }
        Err(err) if err.kind() == ErrorKind::AddrInUse => {
            tracing::warn!("默认端口 1421 已被占用，已自动切换到随机可用端口");

            let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
                .await
                .map_err(|e| format!("绑定随机端口失败: {e}"))?;
            let addr = listener
                .local_addr()
                .map_err(|e| format!("获取随机端口失败: {e}"))?;

            Ok((listener, format!("http://{}", addr)))
        }
        Err(err) => Err(format!("绑定 127.0.0.1:1421 失败: {err}")),
    }
}

/// 应用程序入口
pub fn run() -> Result<(), String> {
    let log_file_path = init_logging();
    install_panic_hook(log_file_path.clone());

    tracing::info!("启动 Majdata Hub 服务器");

    // 清理上次更新残留文件
    if let Err(err) = commands::cleanup_update_files() {
        tracing::warn!("清理更新残留文件失败: {}", err);
    }

    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .map_err(|e| {
            tracing::error!("创建 Tokio runtime 失败: {}", e);
            format!("创建 Tokio runtime 失败: {e}")
        })?;

    rt.block_on(async {
        let app = routes::create_router();

        let (listener, addr) = bind_listener().await.map_err(|e| {
            tracing::error!("{}", e);
            e
        })?;

        tracing::info!("服务器运行于 {}", addr);

        // 自动打开浏览器
        if let Err(err) = open::that(addr) {
            tracing::warn!("自动打开浏览器失败: {}", err);
        }

        axum::serve(listener, app).await.map_err(|e| {
            tracing::error!("服务器启动失败: {}", e);
            format!("服务器启动失败: {e}")
        })
    })
}
