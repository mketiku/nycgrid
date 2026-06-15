// The browser Notification API does not exist in iOS Safari.
// Accessing Notification.permission or calling new Notification() without a
// typeof guard throws a ReferenceError that Next.js surfaces as a misleading error.
//
// Required pattern:
//   if (typeof Notification !== 'undefined' && Notification.permission === ...) { ... }

function containsTypeofNotificationGuard(node) {
  if (!node) return false;
  if (node.type === "BinaryExpression") {
    const { left, right } = node;
    if (
      left?.type === "UnaryExpression" &&
      left.operator === "typeof" &&
      left.argument?.type === "Identifier" &&
      left.argument.name === "Notification"
    )
      return true;
    if (
      right?.type === "UnaryExpression" &&
      right.operator === "typeof" &&
      right.argument?.type === "Identifier" &&
      right.argument.name === "Notification"
    )
      return true;
  }
  if (node.type === "LogicalExpression") {
    return (
      containsTypeofNotificationGuard(node.left) || containsTypeofNotificationGuard(node.right)
    );
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a typeof guard before accessing the Notification API — it is absent on iOS Safari.",
    },
    messages: {
      unguarded:
        "Accessing the Notification API without a typeof guard crashes on iOS. " +
        'Wrap in: if (typeof Notification !== "undefined" && ...) { ... }',
    },
  },
  create(context) {
    let guardDepth = 0;

    function enter(node) {
      if (containsTypeofNotificationGuard(node.test)) guardDepth++;
    }
    function exit(node) {
      if (containsTypeofNotificationGuard(node.test)) guardDepth--;
    }

    function checkIdentifier(identNode) {
      if (guardDepth > 0) return;
      context.report({ node: identNode, messageId: "unguarded" });
    }

    return {
      IfStatement: enter,
      "IfStatement:exit": exit,
      ConditionalExpression: enter,
      "ConditionalExpression:exit": exit,

      MemberExpression(node) {
        if (node.object.type === "Identifier" && node.object.name === "Notification") {
          checkIdentifier(node.object);
        }
      },

      NewExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "Notification") {
          checkIdentifier(node.callee);
        }
      },

      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "Notification") {
          checkIdentifier(node.callee);
        }
      },
    };
  },
};
