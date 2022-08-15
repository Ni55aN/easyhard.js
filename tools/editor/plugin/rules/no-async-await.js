module.exports = {
    meta: {
        messages: {
            noAsyncAwait: 'async/await not allowed',
        },
    },
    create(context) {
        return {
            FunctionDeclaration(node) {
                if (node.async) {
                    context.report({ node, messageId: 'noAsyncAwait' });
                }
            },
            AwaitExpression(node) {
                context.report({ node, messageId: 'noAsyncAwait' });
            }
        }
    }
};
