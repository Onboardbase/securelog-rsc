import React, { FC } from "react";
import SecureLogContainer from "./SecureLogContainer";
import { SecretPattern, SecretInspectorResult } from "../types";

/**
 * `useSecureLog` is a higher-order component (HOC) that wraps the SecureLogContainer
 * component and applies secret inspection to it, allowing users to scan without having
 * to use the SecureLog Component (just incase they dont want it)
 *
 * @param Component The component to wrap.
 * @param customPatterns Optional custom regex patterns for secret detection.
 * @param excludeComponents Optional array of component names to exclude from secret scanning.
 * @param maxDepth Optional maximum depth for recursive scanning of child components.
 * @param mask optional prop to choose if secret should be masked or not.
 */
export const useSecureLog = (
  Component: FC<any>,
  customPatterns?: SecretPattern[],
  excludeComponents?: string[],
  maxDepth?: number,
  mask?: boolean,
  cb?: Function
) => {
  return (props: any) => (
    <SecureLogContainer
      customPatterns={customPatterns}
      excludeComponents={excludeComponents}
      maxDepth={maxDepth}
      onSecretFound={(result: SecretInspectorResult[]) => cb?.(result)}
      mask={mask}
    >
      <Component {...props} />
    </SecureLogContainer>
  );
};
