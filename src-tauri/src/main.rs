// 防止发布构建时弹出黑色控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    xintiao::run();
}
