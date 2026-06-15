// Catches: store.getState().method() called directly in a React component's render body.
// Calling Zustand's getState() during render triggers React's "setState during render"
// warning. Use a hook selector (useMapStore(s => s.method)) or wrap in useEffect instead.

const SAFE_HOOKS = new Set([
  "useEffect",
  "useLayoutEffect",
  "useMemo",
  "useCallback",
  "useInsertionEffect",
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow store.getState().method() calls in component render bodies.",
    },
    messages: {
      forbidden:
        'Do not call store.getState().method() during render — triggers a React "setState during render" warning. ' +
        "Use a hook selector (e.g. useStore(s => s.value)) or wrap in useEffect.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.object.type !== "CallExpression" ||
          node.callee.object.callee.type !== "MemberExpression" ||
          node.callee.object.callee.property.name !== "getState"
        ) {
          return;
        }

        const ancestors = context.sourceCode.getAncestors(node);

        for (let i = ancestors.length - 1; i >= 0; i--) {
          const anc = ancestors[i];
          const isFunc =
            anc.type === "ArrowFunctionExpression" ||
            anc.type === "FunctionExpression" ||
            anc.type === "FunctionDeclaration";
          if (!isFunc) continue;

          const funcParent = i > 0 ? ancestors[i - 1] : null;

          if (funcParent?.type === "CallExpression" && funcParent.arguments.includes(anc)) {
            const callee = funcParent.callee;
            const name = callee.type === "Identifier" ? callee.name : callee.property?.name;
            if (name && SAFE_HOOKS.has(name)) return;
          }

          if (funcParent?.type === "JSXExpressionContainer") return;

          let funcName = null;
          if (anc.type === "FunctionDeclaration") {
            funcName = anc.id?.name ?? null;
          } else if (funcParent?.type === "VariableDeclarator") {
            funcName = funcParent.id?.type === "Identifier" ? funcParent.id.name : null;
          }

          if (funcName && /^[A-Z]/.test(funcName)) {
            context.report({ node, messageId: "forbidden" });
          }

          return;
        }
      },
    };
  },
};
