// Forbids calling Sentry's capture APIs directly. All error reporting must go
// through captureAppError()/captureAppWarning() in @/lib/monitoring/sentry,
// which normalize non-Error values (message-shaped objects, DOM Events,
// strings, null) into titled Errors. Passing those raw to captureException
// yields untitled "Object/Event captured as exception" noise in Sentry.
//
// Allowed: anything inside the monitoring wrapper itself (src/lib/monitoring/**),
// the one place permitted to import the SDK directly.

const FORBIDDEN_METHODS = new Set(["captureException", "captureMessage", "withScope"]);

const SENTRY_MODULE = "@sentry/nextjs";

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct Sentry capture calls — route errors through captureAppError()/captureAppWarning().",
    },
    messages: {
      forbidden:
        "Do not call Sentry.{{name}}() directly. Report through captureAppError()/captureAppWarning() " +
        "from @/lib/monitoring/sentry, which normalize non-Error values into titled Errors.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (filename.includes("/lib/monitoring/")) return {};

    const sentryNamespaces = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== SENTRY_MODULE) return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportNamespaceSpecifier" ||
            spec.type === "ImportDefaultSpecifier"
          ) {
            sentryNamespaces.add(spec.local.name);
          } else if (spec.type === "ImportSpecifier" && FORBIDDEN_METHODS.has(spec.imported.name)) {
            context.report({
              node: spec,
              messageId: "forbidden",
              data: { name: spec.imported.name },
            });
          }
        }
      },
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          sentryNamespaces.has(node.object.name) &&
          node.property.type === "Identifier" &&
          FORBIDDEN_METHODS.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "forbidden",
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};

export default rule;
