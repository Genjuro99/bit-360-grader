# BIT360 Restaurant Grader — Android Test Wrapper

This project packages the public BIT360 Restaurant Grader as a small Android app for phone testing.

## Scope

- Loads only `https://grader.believeintaste.com/` inside the app.
- Requires an internet connection.
- Opens consultation and other outside links in the phone's browser.
- Contains no Professional Assessment, 21-category framework, private scoring engine, or client data.
- Requests only Android's Internet permission.

## Test build

The GitHub Actions workflow builds a debug-signed APK named `BIT360-Restaurant-Grader-v1.0.2-test.apk`. Its debug application ID is `com.believeintaste.bit360grader.test`. The workflow restores one stable, test-only PKCS12 keystore from protected repository secrets, signs the debug APK, records the public signing-certificate fingerprint with the artifact, and removes the restored runner copy after the job. The private keystore is never committed. This is installable for private testing, but it is not a Play Store production release and must never be reused for production signing.

## Repository placement

When deployed to the public grader repository:

- Copy this project to `android-wrapper/`.
- Copy `.github/workflows/build-android-test-apk.yml` to the repository's `.github/workflows/` folder.

The existing GitHub Pages grader remains unchanged. The wrapper simply displays the live public page.
