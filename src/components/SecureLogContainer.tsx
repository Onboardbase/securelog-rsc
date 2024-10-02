import React, { ReactNode, FC, useCallback, useMemo, useEffect } from 'react';
import { useWorker } from '../hooks/useWorker';
import { SecretInspectorResult, SecretPattern, SecureLogContainerProps } from '../types';

const defaultSecretPatterns: SecretPattern[] = [
  { detector: 'Paystack', regex: "\\bsk\\_[a-z]{1,}\\_[A-Za-z0-9]{40}\\b", secretPosition: 0 },
];

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
  onSecretFound = (record: SecretInspectorResult) => {},
  mask = false,  // Added mask option here
}) => {
  const secretPatterns = useMemo(() => [...defaultSecretPatterns, ...customPatterns], [customPatterns]);

  const { runWorker } = useWorker(new URL('../workers/secureLogWorker.js', import.meta.url));

  // inspect a text node and manipulate the DOM
  const inspectTextNode = useCallback(async (text: string, domNode: Node): Promise<boolean> => {
    const foundSecrets = await runWorker({
      text,
      secretPatterns,
      componentName: 'TextNode', // Text nodes don't have a specific component name
    });

    if (foundSecrets.length > 0) {
      foundSecrets.forEach((secret: SecretInspectorResult) => {
        let maskedSecret = secret.rawValue;
        if (mask) {
          // Mask the secret in both the secret object and the DOM
          maskedSecret = maskString(secret.rawValue);
          secret.rawValue = maskedSecret; 

          if (domNode) {
            domNode.textContent = domNode.textContent?.replace(secret.rawValue, maskedSecret) || '';
          }
        }
        onSecretFound(secret);
      });
      return true;
    }

    return false;
  }, [runWorker, secretPatterns, onSecretFound, mask]);

  // inspect nodes (both props and children) and manipulate the DOM
  const inspectNode = useCallback(async (child: ReactNode, domNode: Node, depth: number = 0): Promise<boolean> => {
    if (depth > maxDepth) return false;

    // If the child is a text node, inspect it
    if (typeof child === 'string') {
      return await inspectTextNode(child, domNode);
    }

    // If it's a valid React element, inspect its props and children
    if (React.isValidElement(child)) {
      const { type, props } = child;
      const componentName = getComponentName(type);

      // Skip excluded components
      if (typeof type === 'string' && excludeComponents.includes(type as never)) {
        return false;
      }

      // Check props for secrets
      for (const propKey in props) {
        if (typeof props[propKey] === 'string') {
          const foundSecrets = await runWorker({
            text: props[propKey],
            secretPatterns,
            componentName,
          });

          if (foundSecrets.length > 0) {
            foundSecrets.forEach((secret: SecretInspectorResult) => {
              let maskedSecret = secret.rawValue;
              if (mask) {
                // Mask the secret in both the prop and the DOM
                maskedSecret = maskString(secret.rawValue);
                secret.rawValue = maskedSecret;

                // if secret is passed via a prop, dont mask as this might crash the app if secret is being used by a package

                // if (domNode instanceof HTMLElement) {
                //   domNode.setAttribute(propKey, props[propKey].replace(secret.rawValue, maskedSecret));
                // }
              }
              onSecretFound({ ...secret, componentName });
            });
            return true;
          }
        }
      }

      // Recursively inspect children and manipulate DOM
      if (props.children) {
        return await inspectChildren(props.children, domNode, depth + 1);
      }
    }

    return false;
  }, [maxDepth, secretPatterns, excludeComponents, onSecretFound, runWorker, inspectTextNode, mask]);

  const inspectChildren = useCallback(async (children: ReactNode, domNode: Node, depth: number): Promise<boolean> => {
    let foundSecret = false;
    const childArray = React.Children.toArray(children);

    for (const [index, child] of childArray.entries()) {
      const childDomNode = domNode.childNodes[index]; // Get corresponding DOM node
      if (await inspectNode(child, childDomNode, depth)) {
        foundSecret = true;
      }
    }

    return foundSecret;
  }, [inspectNode]);

  // Check for secrets in the children and manipulate the DOM
  useEffect(() => {
    const containerNode = document.querySelector('#secure-log-container');
    
    const checkForSecrets = async () => {
      if (containerNode) {
        await inspectChildren(children, containerNode, 0);
      }
    };

    checkForSecrets();
  }, [children, inspectChildren]);

  return (
    <div id="secure-log-container">
      {children}
    </div>
  );
};

const getComponentName = (type: any): string => {
  return typeof type === 'string' ? type : type.displayName || type.name || 'Unknown';
};

export default SecureLogContainer;
