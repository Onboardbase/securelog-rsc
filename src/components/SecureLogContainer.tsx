import React, {
  ReactNode,
  FC,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useWorker } from "../hooks/useWorker";
import {
  SecretInspectorResult,
  SecretPattern,
  SecureLogContainerProps,
} from "../types";
import { secureLogDetectors } from "securelog-detectors";

const defaultSecretPatterns: SecretPattern[] = secureLogDetectors;

/**
 *
 * mask secret
 *
 * gotten from https://github.com/Onboardbase/securelog-scan/blob/main/src/util.ts#L70
 */
const maskString = (str: string, visibleChars: number = 5): string => {
  if (typeof str !== "string" || str.length === 0) {
    throw new Error("Invalid input: Input must be a non-empty string.");
  }
  if (visibleChars < 0) {
    throw new Error(
      "Invalid parameter: visibleChars must be a non-negative number."
    );
  }
  if (visibleChars >= str.length) {
    return str; // Return the full string if visibleChars is larger than the string length
  }

  const maskedPart = "*".repeat(
    str.length < 10 ? str.length : 10 - visibleChars
  );
  const visiblePart = str.slice(0, visibleChars);
  return visiblePart + maskedPart;
};

const SecureLogContainer: FC<SecureLogContainerProps> = ({
  children,
  customPatterns = [],
  excludeComponents = [],
  maxDepth = 10,
  onSecretFound = (records: SecretInspectorResult[]) => {},
  mask = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null); // Create a ref for the container

  const secretPatterns = useMemo(
    () => [...defaultSecretPatterns, ...customPatterns],
    [customPatterns]
  );

  const { runWorker } = useWorker(
    new URL("../workers/secureLogWorker.js", import.meta.url)
  );

  const inspectTextNode = useCallback(
    async (
      text: string,
      domNode: Node | null,
      foundSecrets: SecretInspectorResult[]
    ): Promise<boolean> => {
      const secrets = await runWorker({
        text,
        secretPatterns,
        componentName: "TextNode",
      });

      if (secrets.length > 0) {
        secrets.forEach((secret: SecretInspectorResult) => {
          const originalSecret = secret.rawValue;
          let maskedSecret = secret.rawValue;
          if (mask) {
            // Mask the secret and update the DOM if available
            maskedSecret = maskString(secret.rawValue);
            secret.rawValue = maskedSecret;

            if (
              domNode &&
              domNode.nodeType === Node.TEXT_NODE &&
              domNode.textContent
            ) {
              domNode.textContent = domNode.textContent.replace(
                originalSecret,
                maskedSecret
              );
            }
          }
          foundSecrets.push(secret);
        });
        return true;
      }

      return false;
    },
    [runWorker, secretPatterns, mask]
  );

  const inspectNode = useCallback(
    async (
      child: ReactNode,
      domNode: Node | null,
      depth: number,
      foundSecrets: SecretInspectorResult[]
    ): Promise<boolean> => {
      if (depth > maxDepth) return false;

      if (typeof child === "string") {
        return await inspectTextNode(child, domNode, foundSecrets);
      }

      if (React.isValidElement(child)) {
        const { type, props } = child;
        const componentName = getComponentName(type);

        if (
          typeof type === "string" &&
          excludeComponents.includes(type as never)
        ) {
          return false;
        }

        for (const propKey in props) {
          if (typeof props[propKey] === "string") {
            const secrets = await runWorker({
              text: props[propKey],
              secretPatterns,
              componentName,
            });

            if (secrets.length > 0) {
              secrets.forEach((secret: SecretInspectorResult) => {
                const originalSecret = secret.rawValue;
                let maskedSecret = secret.rawValue;
                if (mask) {
                  maskedSecret = maskString(secret.rawValue);
                  secret.rawValue = maskedSecret;

                  if (domNode && domNode.textContent) {
                    domNode.textContent = domNode.textContent.replace(
                      originalSecret,
                      maskedSecret
                    );

                    // disable props
                    // props[propKey] = undefined;
                  }
                }
                foundSecrets.push(secret);
              });
              return true;
            }
          }
        }

        if (props.children) {
          return await inspectChildren(
            props.children,
            domNode,
            depth + 1,
            foundSecrets
          );
        }
      }

      return false;
    },
    [
      maxDepth,
      secretPatterns,
      excludeComponents,
      runWorker,
      inspectTextNode,
      mask,
    ]
  );

  const inspectChildren = useCallback(
    async (
      children: ReactNode,
      domNode: Node | null,
      depth: number,
      foundSecrets: SecretInspectorResult[]
    ): Promise<boolean> => {
      let foundSecret = false;
      const childArray = React.Children.toArray(children);

      for (const [index, child] of childArray.entries()) {
        const childDomNode = domNode?.childNodes[index] || null;
        if (await inspectNode(child, childDomNode, depth, foundSecrets)) {
          foundSecret = true;
        }
      }

      return foundSecret;
    },
    [inspectNode]
  );

  // Collect secrets and trigger callback once for all secrets in the container
  useEffect(() => {
    const containerNode = containerRef.current;
    const foundSecrets: SecretInspectorResult[] = [];

    const checkForSecrets = async () => {
      if (containerNode) {
        await inspectChildren(children, containerNode, 0, foundSecrets);
        if (foundSecrets.length > 0) {
          onSecretFound(foundSecrets);
        }
      }
    };

    if (children) {
      checkForSecrets();
    }
  }, [children, inspectChildren, onSecretFound]);

  return (
    <div id="secure-log-container" ref={containerRef}>
      {children}
    </div>
  );
};

const getComponentName = (type: any): string => {
  return typeof type === "string"
    ? type
    : type.displayName || type.name || "Unknown";
};

export default SecureLogContainer;
