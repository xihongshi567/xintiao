use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use winreg::enums::{HKEY_CURRENT_USER, KEY_SET_VALUE};
use winreg::RegKey;

/// 开机自启：写入 HKCU\...\CurrentVersion\Run 注册表键
const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const RUN_VALUE: &str = "薪跳";

/// 托盘中的「开机自启」勾选项，供设置页（JS 命令）同步状态
struct AutostartItem(CheckMenuItem<tauri::Wry>);

fn autostart_enabled() -> bool {
    RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(RUN_KEY)
        .and_then(|k| k.get_value::<String, _>(RUN_VALUE))
        .map(|v| !v.is_empty())
        .unwrap_or(false)
}

fn set_autostart(enabled: bool) -> Result<(), String> {
    let run = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey_with_flags(RUN_KEY, KEY_SET_VALUE)
        .map_err(|e| e.to_string())?;
    if enabled {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        run.set_value(RUN_VALUE, &format!("\"{}\"", exe.display()))
            .map_err(|e| e.to_string())
    } else {
        let _ = run.delete_value(RUN_VALUE);
        Ok(())
    }
}

#[tauri::command]
fn get_autostart() -> bool {
    autostart_enabled()
}

#[tauri::command]
fn set_autostart_cmd(app: AppHandle, enabled: bool) -> Result<(), String> {
    set_autostart(enabled)?;
    let item = app.state::<AutostartItem>();
    item.0.set_checked(enabled).map_err(|e| e.to_string())
}

fn toggle_main_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.is_visible().and_then(|v| {
            if v {
                win.hide()
            } else {
                win.show().and_then(|_| win.set_focus())
            }
        });
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 二次启动时唤出已有窗口
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .setup(|app| {
            // 系统托盘：左键显示/隐藏，右键菜单
            let show_hide = MenuItem::with_id(app, "show-hide", "显示 / 隐藏", true, None::<&str>)?;
            let autostart = CheckMenuItem::with_id(
                app,
                "autostart",
                "开机自启",
                true,
                autostart_enabled(),
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let menu =
                Menu::with_items(app, &[&show_hide, &autostart, &sep, &quit])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().expect("缺少窗口图标").clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event({
                    let autostart_cb = autostart.clone();
                    move |app, event| match event.id.as_ref() {
                        "show-hide" => toggle_main_window(app),
                        "autostart" => {
                            let next = !autostart_enabled();
                            if set_autostart(next).is_ok() {
                                let _ = autostart_cb.set_checked(next);
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            app.manage(AutostartItem(autostart));

            // 点窗口关闭按钮 → 隐藏到托盘而不是退出
            if let Some(win) = app.get_webview_window("main") {
                let win2 = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win2.hide();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_autostart, set_autostart_cmd])
        .run(tauri::generate_context!())
        .expect("运行薪跳时发生错误");
}
