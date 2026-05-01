// 模块声明
pub mod checksum;
pub mod file_system;
pub mod network;
pub mod zip;

// 重新导出所有 Tauri 命令，方便在 lib.rs 中统一注册
pub use checksum::{calculate_checksums, save_checksums_to_file};
pub use file_system::{
    create_chart_category, create_directory, delete_chart, delete_skin, execute_bat_file,
    file_exists, get_app_exe_folder_path, get_app_exe_path, get_launch_options, greet, import_chart_zips,
    launch_game, list_bat_files, list_chart_categories, list_charts_in_category, list_skins, move_chart,
    pick_files, read_file_content, write_file_content, ImportResult,
};
pub use network::{
    clear_api_cache, download_charts_batch, download_file_to_path, download_skin_zip,
    fetch_chart_list, fetch_github_skins, fetch_remote_hashes,
};
pub use zip::{download_and_extract, extract_zip};
