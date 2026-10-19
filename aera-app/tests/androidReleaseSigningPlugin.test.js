const { applyReleaseSigning } = require("../plugins/withAndroidReleaseSigning");

const gradleTemplate = `def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
    packagingOptions {
    }
}

// Apply static values from \`gradle.properties\` to the \`android.packagingOptions\`
`;

describe("Android release signing config plugin", () => {
  test("configures private release signing and rejects missing signing properties", () => {
    const result = applyReleaseSigning(gradleTemplate);

    expect(result).toContain('storeFile file(aeraReleaseSigningProperties.AERA_UPLOAD_STORE_FILE)');
    expect(result).toContain("signingConfig signingConfigs.release");
    expect(result).toContain("gradle.taskGraph.whenReady");
    expect(result).toContain("Cannot package a release without signing credentials.");
    expect(result).not.toContain("release {\n            signingConfig signingConfigs.debug");
  });

  test("does not duplicate signing configuration when applied repeatedly", () => {
    const once = applyReleaseSigning(gradleTemplate);

    expect(applyReleaseSigning(once)).toBe(once);
  });

  test("fails explicitly when the generated Gradle layout is unsupported", () => {
    expect(() => applyReleaseSigning("android { }")).toThrow(
      "Unable to apply Android release signing plugin"
    );
  });
});
