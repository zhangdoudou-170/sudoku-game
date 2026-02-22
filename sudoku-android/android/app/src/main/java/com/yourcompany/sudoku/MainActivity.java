package com.yourcompany.sudoku;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private long lastBackPressTime = 0;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 启用 WebView 调试（开发时可用）
        WebView.setWebContentsDebuggingEnabled(true);
    }
    
    @Override
    public void onBackPressed() {
        // 获取 WebView 并检查是否可以返回
        WebView webView = getBridge().getWebView();
        
        if (webView.canGoBack()) {
            // 如果有历史记录，返回上一页
            webView.goBack();
        } else {
            // 否则双击返回键退出
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastBackPressTime > 2000) {
                // 2秒内再次点击才退出
                lastBackPressTime = currentTime;
                // 通过 JS 提示用户
                webView.evaluateJavascript(
                    "if(window.showToast) window.showToast('再按一次返回键退出');",
                    null
                );
            } else {
                // 退出应用
                super.onBackPressed();
            }
        }
    }
}