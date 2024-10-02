import React from "react";

export interface SecretPattern {
  detector: string;
  regex: string; // Regex as a string because Web Workers can't transfer RegExp objects
  secretPosition: number;
}

export interface SecretInspectorResult {
  rawValue: string;
  line: number;
  detector: string;
  componentName?: string;
}

export interface SecureLogContainerProps {
  children: React.ReactNode;
  customPatterns?: SecretPattern[];
  excludeComponents?: string[];
  maxDepth?: number;
  mask?: boolean;
  onSecretFound?: (result: SecretInspectorResult) => void;
}
