const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'kokebok',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategory', inputVars);
}
createCategoryRef.operationName = 'CreateCategory';
exports.createCategoryRef = createCategoryRef;

exports.createCategory = function createCategory(dcOrVars, vars) {
  return executeMutation(createCategoryRef(dcOrVars, vars));
};

const listPublicRecipesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicRecipes');
}
listPublicRecipesRef.operationName = 'ListPublicRecipes';
exports.listPublicRecipesRef = listPublicRecipesRef;

exports.listPublicRecipes = function listPublicRecipes(dc) {
  return executeQuery(listPublicRecipesRef(dc));
};

const updateRecipeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRecipe', inputVars);
}
updateRecipeRef.operationName = 'UpdateRecipe';
exports.updateRecipeRef = updateRecipeRef;

exports.updateRecipe = function updateRecipe(dcOrVars, vars) {
  return executeMutation(updateRecipeRef(dcOrVars, vars));
};

const getMyCookbooksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyCookbooks');
}
getMyCookbooksRef.operationName = 'GetMyCookbooks';
exports.getMyCookbooksRef = getMyCookbooksRef;

exports.getMyCookbooks = function getMyCookbooks(dc) {
  return executeQuery(getMyCookbooksRef(dc));
};
