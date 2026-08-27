'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const main = read('app/src/main/java/com/believeintaste/bit360grader/MainActivity.java');
const manifest = read('app/src/main/AndroidManifest.xml');
const appGradle = read('app/build.gradle');
const strings = read('app/src/main/res/values/strings.xml');
const gitignore = read('../.gitignore');
const rootGradle = read('build.gradle');
const localWorkflow = path.join(root, '.github/workflows/build-android-test-apk.yml');
const deployedWorkflow = path.join(root, '../.github/workflows/build-android-test-apk.yml');
const workflow = fs.readFileSync(fs.existsSync(localWorkflow) ? localWorkflow : deployedWorkflow, 'utf8');

let passed = 0;
const checks = [];

function check(name, condition) {
  checks.push({ name, condition: Boolean(condition) });
  if (condition) passed += 1;
}

check('Exact branded grader URL', main.includes('https://grader.believeintaste.com/'));
check('Branded grader host locked', main.includes('ALLOWED_HOST = "grader.believeintaste.com"'));
check('Allowed path begins at root', main.includes('ALLOWED_PATH_PREFIX = "/"'));
check('Legacy GitHub Pages host removed', !main.includes('genjuro99.github.io'));
check('HTTPS scheme required', main.includes('"https".equalsIgnoreCase(uri.getScheme())'));
check('External links use system browser', main.includes('new Intent(Intent.ACTION_VIEW, uri)'));
check('JavaScript enabled for React app', main.includes('setJavaScriptEnabled(true)'));
check('DOM storage enabled', main.includes('setDomStorageEnabled(true)'));
check('File access disabled', main.includes('setAllowFileAccess(false)'));
check('Content access disabled', main.includes('setAllowContentAccess(false)'));
check('Mixed content blocked', main.includes('MIXED_CONTENT_NEVER_ALLOW'));
check('Safe Browsing enabled', main.includes('setSafeBrowsingEnabled(true)'));
check('SSL errors are cancelled', main.includes('handler.cancel()'));
check('Main-frame errors handled', main.includes('request.isForMainFrame()'));
check('Legacy WebView errors handled', main.includes('int errorCode,') && main.includes('String failingUrl'));
check('Main-frame error state guarded', main.includes('hasMainFrameError') && main.includes('!hasMainFrameError'));
check('Failed load stopped before branded error', main.includes('view.stopLoading()'));
check('Successful retry clears failed WebView history', main.includes('view.clearHistory()'));
check('Android Back exits instead of reopening WebView history',
  main.includes('public void onBackPressed()') &&
  main.includes('super.onBackPressed();') &&
  !main.includes('webView.goBack()'));
check('Retry control implemented', main.includes('retryButton.setOnClickListener'));
check('WebView back-history navigation disabled', !main.includes('webView.canGoBack()'));
check('No professional assessment URL', !main.includes('full-engagement'));
check('Only Internet permission requested', (manifest.match(/uses-permission/g) || []).length === 1);
check('Internet permission present', manifest.includes('android.permission.INTERNET'));
check('Cleartext traffic disabled', manifest.includes('android:usesCleartextTraffic="false"'));
check('Android backup disabled', manifest.includes('android:allowBackup="false"'));
check('No camera permission', !manifest.includes('CAMERA'));
check('No location permission', !manifest.includes('LOCATION'));
check('No storage permission', !manifest.includes('STORAGE'));
check('Correct application ID', appGradle.includes("applicationId 'com.believeintaste.bit360grader'"));
check('Standard test application ID suffix', appGradle.includes("applicationIdSuffix '.test'"));
check('Stable test signing is environment-gated',
  appGradle.includes("System.getenv('BIT360_TEST_KEYSTORE_PATH')") &&
  appGradle.includes('hasStableTestSigning'));
check('Stable test signing uses PKCS12', appGradle.includes("storeType 'PKCS12'"));
check('Private signing files are ignored',
  gitignore.includes('*.jks') &&
  gitignore.includes('*.keystore') &&
  gitignore.includes('*.p12') &&
  gitignore.includes('key.properties'));
check('Minimum Android API 26', appGradle.includes('minSdk 26'));
check('Target Android API 36', appGradle.includes('targetSdk 36'));
check('Compile Android API 36', appGradle.includes('compileSdk 36'));
check('Test version code', appGradle.includes('versionCode 102'));
check('Test version name', appGradle.includes("versionName '1.0.2-test'"));
check('Production-safe app label', strings.includes('BIT360 Restaurant Grader'));
check('Java 17 source', appGradle.includes('JavaVersion.VERSION_17'));
check('Android Gradle Plugin 9.2.0', rootGradle.includes("version '9.2.0'"));
check('Workflow uses Java 17', workflow.includes("java-version: '17'"));
check('Workflow uses Gradle 9.4.1', workflow.includes("gradle-version: '9.4.1'"));
check('Workflow installs Android 36', workflow.includes("'platforms;android-36'"));
check('Workflow builds debug APK', workflow.includes('clean assembleDebug'));
check('Workflow uploads APK artifact', workflow.includes('actions/upload-artifact@v4'));
check('Workflow creates SHA-256 record', workflow.includes('sha256sum'));
check('Workflow verifies APK and records signing certificate',
  workflow.includes('apksigner') &&
  workflow.includes('SIGNING-CERTIFICATE.txt'));
check('Workflow has read-only contents permission', workflow.includes('contents: read'));
check('Workflow uses only the four approved test-signing secrets', (() => {
  const actual = [...workflow.matchAll(/secrets\.([A-Z0-9_]+)/g)].map(match => match[1]);
  const unique = [...new Set(actual)].sort();
  const expected = [
    'BIT360_TEST_KEYSTORE_BASE64',
    'BIT360_TEST_KEY_ALIAS',
    'BIT360_TEST_KEY_PASSWORD',
    'BIT360_TEST_STORE_PASSWORD'
  ].sort();
  return JSON.stringify(unique) === JSON.stringify(expected);
})());
check('Workflow removes restored test keystore',
  workflow.includes('if: always()') &&
  workflow.includes('rm -f "$RUNNER_TEMP/bit360-test-signing.p12"'));
check('Workflow does not print signing secrets',
  !workflow.includes('echo "$BIT360_TEST_') &&
  !workflow.includes('set -x'));

for (const result of checks) {
  console.log(`${result.condition ? 'PASS' : 'FAIL'} — ${result.name}`);
}

console.log(`\n${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exit(1);
