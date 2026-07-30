package com.believeintaste.bit360grader;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String LIVE_URL = "https://genjuro99.github.io/bit-360-grader/";
    private static final String ALLOWED_HOST = "genjuro99.github.io";
    private static final String ALLOWED_PATH_PREFIX = "/bit-360-grader/";

    private WebView webView;
    private View errorPanel;
    private TextView errorMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.web_view);
        errorPanel = findViewById(R.id.error_panel);
        errorMessage = findViewById(R.id.error_message);
        Button retryButton = findViewById(R.id.retry_button);

        configureWebView();
        retryButton.setOnClickListener(view -> loadGrader());
        loadGrader();
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                if (isAllowedGraderUrl(Uri.parse(url))) {
                    showWebView();
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isAllowedGraderUrl(Uri.parse(url))) {
                    showWebView();
                }
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError(getString(R.string.connection_error));
                }
            }

            @Override
            public void onReceivedSslError(
                    WebView view,
                    SslErrorHandler handler,
                    SslError error) {
                handler.cancel();
                showError(getString(R.string.security_error));
            }
        });
    }

    private boolean handleNavigation(Uri uri) {
        if (isAllowedGraderUrl(uri)) {
            return false;
        }

        if ("https".equalsIgnoreCase(uri.getScheme())) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException exception) {
                Toast.makeText(this, R.string.no_browser_error, Toast.LENGTH_LONG).show();
            }
        }
        return true;
    }

    private boolean isAllowedGraderUrl(Uri uri) {
        String path = uri.getPath();
        return "https".equalsIgnoreCase(uri.getScheme())
                && ALLOWED_HOST.equalsIgnoreCase(uri.getHost())
                && path != null
                && path.startsWith(ALLOWED_PATH_PREFIX);
    }

    private void loadGrader() {
        errorPanel.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(LIVE_URL);
    }

    private void showWebView() {
        errorPanel.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
    }

    private void showError(String message) {
        errorMessage.setText(message);
        webView.setVisibility(View.GONE);
        errorPanel.setVisibility(View.VISIBLE);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        webView.stopLoading();
        webView.setWebViewClient(null);
        webView.destroy();
        super.onDestroy();
    }
}
