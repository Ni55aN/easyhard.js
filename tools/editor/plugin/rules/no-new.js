module.exports = {
    meta: {
        messages: {
            noNew: 'new operator not allowed',
        },
    },
    create(context) {
        return {
            NewExpression(node) {
                context.report({ node, messageId: 'noNew' });
            }
        }
    }
};
