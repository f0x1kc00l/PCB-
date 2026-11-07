package com.pcbcourse.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * Главный экран приложения: WebView с сайтом курса (Capacitor).
 *
 * Сайт многостраничный, поэтому системная кнопка «Назад» должна листать историю
 * страниц, как в браузере. Без этого обработчика Capacitor (без плагина @capacitor/app)
 * просто закрывает приложение при первом же нажатии.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    // Есть куда вернуться — предыдущая страница курса.
                    webView.goBack();
                } else {
                    // Первая страница — отдаём нажатие системе (свернуть приложение).
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }
}
