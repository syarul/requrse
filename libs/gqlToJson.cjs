const gql = require("graphql-tag");

/**
 * convert GraphQL AST literal to JS value
 */
function getLiteralValue(node) {
  switch (node.kind) {
    case "IntValue":
      return parseInt(node.value, 10);
    case "FloatValue":
      return parseFloat(node.value);
    case "BooleanValue":
      return node.value === "true";
    case "StringValue":
      return node.value;
    case "NullValue":
      return null;
    case "EnumValue":
      return node.value;
    case "ListValue":
      return node.values.map(getLiteralValue);
    case "ObjectValue":
      return node.fields.reduce((acc, f) => {
        acc[f.name.value] = getLiteralValue(f.value);
        return acc;
      }, {});
    default:
      return node.value;
  }
}

/**
 * convert GraphQL query string to JSON object format, simple no spread or fragments support yet
 * @param {string} gqlQuery
 * @returns {object}
 */
function gqlToJson(gqlQuery, rootKey = "data") {
  const ast = gql(gqlQuery);

  function transformSelection(selection) {
    const fieldName = selection?.name?.value;

    const args = selection.arguments?.reduce((acc, arg) => {
      acc[arg.name.value] = getLiteralValue(arg.value);
      return acc;
    }, {});

    let fieldValue = 1;

    // handle nested selections
    if (selection.selectionSet) {
      fieldValue = selection.selectionSet.selections.reduce(
        (acc, subSel) => Object.assign(acc, transformSelection(subSel)),
        {},
      );
    }

    // add $params if arguments exist
    if (Object.keys(args).length > 0) {
      if (fieldValue === 1) {
        fieldValue = { $params: args };
      } else {
        fieldValue.$params = args;
      }
    }

    return { [fieldName]: fieldValue };
  }

  const root = ast.definitions[0].selectionSet.selections.reduce(
    (acc, sel) => Object.assign(acc, transformSelection(sel)),
    {},
  );

  return { [rootKey]: root };
}

module.exports = gqlToJson;
