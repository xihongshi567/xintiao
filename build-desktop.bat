@echo off
REM 薪跳 · 桌面版一键构建（生成 release exe）
REM 需要：Rust 工具链 + VS 2022 Build Tools（C++ 桌面开发工作负载）
cd /d %~dp0src-tauri
set NO_PROXY=*
cargo build --release
echo.
echo 构建完成：src-tauri\target\release\薪跳.exe
pause
