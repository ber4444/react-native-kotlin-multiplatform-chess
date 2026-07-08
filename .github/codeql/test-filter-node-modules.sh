#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

jq -n '
  {
    version: "2.1.0",
    runs: [
      {
        results: [
          {
            ruleId: "keep-source-result",
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: "my-app/src/index.ts"
                  }
                }
              }
            ]
          },
          {
            ruleId: "remove-alert-7",
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: "my-app/node_modules/react-native-svg/PathParser.java"
                  }
                }
              }
            ]
          },
          {
            ruleId: "remove-alert-8",
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: "my-app/node_modules/@expo/log-box/android/src/main/expo/modules/logbox/ExpoLogBoxWebViewWrapper.kt"
                  }
                }
              }
            ]
          },
          {
            ruleId: "remove-root-node-modules-result",
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: "node_modules/example/index.js"
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
' \
  | jq --from-file "$script_dir/filter-node-modules.jq" \
  | jq -e '
      [.runs[].results[].ruleId] == ["keep-source-result"]
    ' >/dev/null
