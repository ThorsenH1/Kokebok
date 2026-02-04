import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'kokebok',
  location: 'us-east4'
};

export const createCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategory', inputVars);
}
createCategoryRef.operationName = 'CreateCategory';

export function createCategory(dcOrVars, vars) {
  return executeMutation(createCategoryRef(dcOrVars, vars));
}

export const listPublicRecipesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPublicRecipes');
}
listPublicRecipesRef.operationName = 'ListPublicRecipes';

export function listPublicRecipes(dc) {
  return executeQuery(listPublicRecipesRef(dc));
}

export const updateRecipeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRecipe', inputVars);
}
updateRecipeRef.operationName = 'UpdateRecipe';

export function updateRecipe(dcOrVars, vars) {
  return executeMutation(updateRecipeRef(dcOrVars, vars));
}

export const getMyCookbooksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyCookbooks');
}
getMyCookbooksRef.operationName = 'GetMyCookbooks';

export function getMyCookbooks(dc) {
  return executeQuery(getMyCookbooksRef(dc));
}

