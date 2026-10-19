const { withAppBuildGradle } = require("@expo/config-plugins");

const SIGNING_PROPERTIES_MARKER = "def aeraReleaseSigningPropertyNames = [";

const signingPropertiesBlock = [
  SIGNING_PROPERTIES_MARKER,
  '    "AERA_UPLOAD_STORE_FILE",',
  '    "AERA_UPLOAD_STORE_PASSWORD",',
  '    "AERA_UPLOAD_KEY_ALIAS",',
  '    "AERA_UPLOAD_KEY_PASSWORD"',
  "]",
  "def aeraReleaseSigningProperties = aeraReleaseSigningPropertyNames.collectEntries { name ->",
  "    [(name): findProperty(name)]",
  "}",
  "def aeraMissingReleaseSigningProperties = aeraReleaseSigningPropertyNames.findAll { name ->",
  "    !aeraReleaseSigningProperties[name]?.toString()?.trim()",
  "}",
  "def aeraReleaseSigningConfigured = aeraMissingReleaseSigningProperties.isEmpty()"
].join("\n");

const releaseSigningConfig = [
  "        if (aeraReleaseSigningConfigured) {",
  "            release {",
  "                storeFile file(aeraReleaseSigningProperties.AERA_UPLOAD_STORE_FILE)",
  "                storePassword aeraReleaseSigningProperties.AERA_UPLOAD_STORE_PASSWORD",
  "                keyAlias aeraReleaseSigningProperties.AERA_UPLOAD_KEY_ALIAS",
  "                keyPassword aeraReleaseSigningProperties.AERA_UPLOAD_KEY_PASSWORD",
  "            }",
  "        }"
].join("\n");

const releaseSigningSelection = [
  "            if (aeraReleaseSigningConfigured) {",
  "                signingConfig signingConfigs.release",
  "            }"
].join("\n");

const releaseSigningValidation = [
  "gradle.taskGraph.whenReady { taskGraph ->",
  "    if (taskGraph.allTasks.any { it.project == project && it.name in ['packageRelease', 'bundleRelease'] }) {",
  "        if (!aeraReleaseSigningConfigured) {",
  "            throw new GradleException(",
  '                "Cannot package a release without signing credentials. Configure these user-level Gradle properties: " +',
  '                "${aeraMissingReleaseSigningProperties.join(", ")}"',
  "            )",
  "        }",
  "        if (!file(aeraReleaseSigningProperties.AERA_UPLOAD_STORE_FILE).isFile()) {",
  "            throw new GradleException(",
  '                "Android release keystore not found at ${aeraReleaseSigningProperties.AERA_UPLOAD_STORE_FILE}"',
  "            )",
  "        }",
  "    }",
  "}"
].join("\n");

function replaceOnce(contents, search, replacement, description) {
  const first = contents.indexOf(search);
  if (first < 0 || contents.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Unable to apply Android release signing plugin: expected one ${description}.`);
  }
  return contents.slice(0, first) + replacement + contents.slice(first + search.length);
}

function applyReleaseSigning(contents) {
  if (contents.includes(SIGNING_PROPERTIES_MARKER) || contents.includes("def releaseSigningPropertyNames = [")) {
    return contents;
  }

  const minifyDeclaration = "def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()";
  contents = replaceOnce(
    contents,
    minifyDeclaration,
    `${minifyDeclaration}\n\n${signingPropertiesBlock}`,
    "the release-minify declaration"
  );

  const signingConfigsStart = contents.indexOf("    signingConfigs {\n");
  const signingConfigsEnd = contents.indexOf("    }\n    buildTypes {\n", signingConfigsStart);
  if (signingConfigsStart < 0 || signingConfigsEnd < 0) {
    throw new Error("Unable to apply Android release signing plugin: expected the signingConfigs block.");
  }
  contents =
    contents.slice(0, signingConfigsEnd) +
    `${releaseSigningConfig}\n` +
    contents.slice(signingConfigsEnd);

  const releaseBlock = /(^        release \{\n)([\s\S]*?)(^        \}\n    \}\n    packagingOptions)/m;
  const match = contents.match(releaseBlock);
  if (!match || !match[2].includes("            signingConfig signingConfigs.debug")) {
    throw new Error("Unable to apply Android release signing plugin: expected the release build type.");
  }
  const releaseContents = match[2].replace(
    "            signingConfig signingConfigs.debug",
    releaseSigningSelection
  );
  contents = contents.replace(releaseBlock, `${match[1]}${releaseContents}${match[3]}`);

  const packagingOptionsComment = "// Apply static values from `gradle.properties` to the `android.packagingOptions`";
  contents = replaceOnce(
    contents,
    packagingOptionsComment,
    `${releaseSigningValidation}\n\n${packagingOptionsComment}`,
    "the packaging-options comment"
  );

  return contents;
}

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = applyReleaseSigning(config.modResults.contents);
    return config;
  });
}

module.exports = withAndroidReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
