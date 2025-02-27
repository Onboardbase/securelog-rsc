# Securelog React Server Component

SecureLog RSC is a React component designed to detect and mask sensitive information (secrets) in your application. It leverages a worker-based approach to scan text nodes and component props for patterns already supported by the [Securelog Scan CLI](https://github.com/Onboardbase/securelog-scan). It also allows for custom secret patterns and provides the option to mask detected secrets both in the DOM and in the results.

Need Secret scanning in other places?
- [Securelog for your clean logs](https://github.com/Onboardbase/securelog)
- [Securelog for your build and runtime logs](https://github.com/Onboardbase/securelog-scan)

[Powered by Securelog](https://securelog.com)

## Features

- **Secret Detection**: Scan text and props of React elements to detect sensitive information based on custom regex patterns.
- **DOM Manipulation**: Automatically masks detected secrets directly in the DOM to prevent them from being displayed.
- **Customizable**: Support for custom secret patterns.
- **Asynchronous Processing**: Uses web workers to process the scanning asynchronously, improving performance for large component trees.
- **Depth Limiting**: Controls how deep the secret inspector scans into the component tree.
- **Secret Masking**: Option to mask secrets to avoid displaying sensitive secret on the DOM

## Demo

Check out the [live demo](https://example.securelog.com/) to see the `SecureLog` react component in action.

## Performance Considerations

While the SecureLog React Component is optimized for runtime scanning and masking of secrets, using it with very large or deeply nested component structures may lead to a slight increase in rendering times. It is recommended to use this component judiciously in performance-critical parts of your application to minimize any potential impact on the user experience.

## Installation

```bash
yarn add securelog-rsc  # npm i securelog-rsc
```

## Usage

### Basic usage

Wrap your application or part of your component tree with `SecureLog` to inspect its children for secrets:

```tsx
import React from "react";
import { SecureLog } from "securelog-rsc";

const App = () => {
  return (
    <SecureLog onSecretFound={(secret) => console.log("Secret found:", secret)}>
      <div>
        My Stripe key is sk_test_********************************
      </div>
    </SecureLog>
  );
};

export default App;
```

### SecureLog RSC also suports React HOC (useSecurelog)

`useSecureLog` is a Higher-Order Component (HOC) that wraps the `SecureLog` component and provides secret inspection to any component without requiring the use of `SecureLog` directly.

```tsx
import React from "react";
import { useSecureLog } from "securelog-rsc";

const MyComponent = () => {
  return (
    <div>My secret key is sk_test_***********************</div>
  );
};

const WrappedComponent = useSecureLog(
  MyComponent,
  undefined,
  ["input"],
  10,
  true,
  (secret) => {
    console.log("Secret found:", secret); // provides a fallback to see returned results
  }
);

export default WrappedComponent;
```

### Custom patterns

You can pass custom secret patterns to scan for, in addition to the default ones.

```tsx
const customPatterns = [
  {
    detector: "CustomKey",
    regex: "\\bck\\_[a-zA-Z0-9]{32}\\b",
    secretPosition: 0,
  },
];

<SecureLog
  customPatterns={customPatterns}
  onSecretFound={(secret) => console.log("Custom secret found:", secret)}
>
  <div>My custom key is ck_**************************</div>
</SecureLog>;
```

### Secret masking

You can enable masking to replace detected secrets with asterisks. This will both mask the secret in the \`onSecretFound\` callback and in the DOM.

```tsx
<SecureLog
  mask={true}
  onSecretFound={(secret) => console.log("Masked secret found:", secret)}
>
  <div>My Stripe key is sk_test_**************************</div>
</SecureLog>
```

### Exclude components

You can exclude certain components from the inspection process by passing an array of component types to the \`excludeComponents\` prop.

```tsx
<SecureLog excludeComponents={["input", "textarea"]}>
  <div>My Stripe key is sk_test_****************************</div>
  <input value="sk_test_*******************************" />
</SecureLog>
```

## Props

| Prop              | Type                                    | Default  | Description                                                             |
| ----------------- | --------------------------------------- | -------- | ----------------------------------------------------------------------- |
| customPatterns    | SecretPattern[]                         | []       | Array of custom regex patterns to detect secrets.                       |
| excludeComponents | string[]                                | []       | Components to exclude from secret detection.                            |
| maxDepth          | number                                  | 10       | Maximum depth for recursive child inspection.                           |
| onSecretFound     | (secret: SecretInspectorResult) => void | () => {} | Callback invoked when a secret is found.                                |
| mask              | boolean                                 | false    | If true, secrets are masked both in the DOM and in the callback result. |

## Types

### SecretInspectorResult

```ts
type SecretInspectorResult = {
  secret: string;
  componentName: string;
  detector: string;
};
```

- secret: The detected secret.
- componentName: The name of the React component where the secret was found.
- detector: The name of the detector that found the secret.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
