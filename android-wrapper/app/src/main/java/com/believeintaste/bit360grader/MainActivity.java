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
    private static final String LIVE_URL = "https://grader.believeintaste.com/";
    private static final String ALLOWED_HOST = "grader.believeintaste.com";
    private static final String ALLOWED_PATH_PREFIX = "/";

    private WebView webView;
    private View errorPanel;
    private TextView errorMessage;
    private boolean hasMainFrameError;

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
                    hasMainFrameError = false;
                    showWebView();
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!hasMainFrameError && isAllowedGraderUrl(Uri.parse(url))) {
                    // The grader is a single-page experience and external links open in the
                    // system browser. Remove failed retry entries so Android Back can never
                    // reveal WebView's raw network-error page after a successful recovery.
                    view.clearHistory();
                    showWebView();
                }
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error) {
                if (request.isForMainFrame()) {
                    showConnectionError(view);
                }
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(
                    WebView view,
                    int errorCode,
                    String description,
                    String failingUrl) {
                if (failingUrl != null && isAllowedGraderUrl(Uri.parse(failingUrl))) {
                    showConnectionError(view);
                }
            }

            @Override
            public void onReceivedSslError(
                    WebView view,
                    SslErrorHandler handler,
                    SslError error) {
                handler.cancel();
                hasMainFrameError = true;
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
        hasMainFrameError = false;
        errorPanel.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(LIVE_URL);
    }

    private void showConnectionError(WebView view) {
        hasMainFrameError = true;
        view.stopLoading();
        showError(getString(R.string.connection_error));
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
        // The grader is one single-page workflow. External destinations open in the
        // system browser, so WebView history is never a valid in-app destination.
        // Exiting here also guarantees that a recovered network-error entry cannot
        // become visible through Android Back on devices that retain it despite
        // clearHistory() after Retry.
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        webView.stopLoading();
        webView.setWebViewClient(null);
        webView.destroy();
        super.onDestroy();
    }
}
