import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface Cookbook_Key {
  id: UUIDString;
  __typename?: 'Cookbook_Key';
}

export interface CreateCategoryData {
  category_insert: Category_Key;
}

export interface CreateCategoryVariables {
  name: string;
}

export interface GetMyCookbooksData {
  cookbooks: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    author?: string | null;
    publicationYear?: number | null;
  } & Cookbook_Key)[];
}

export interface ListPublicRecipesData {
  recipes: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
  } & Recipe_Key)[];
}

export interface RecipeCategory_Key {
  recipeId: UUIDString;
  categoryId: UUIDString;
  __typename?: 'RecipeCategory_Key';
}

export interface Recipe_Key {
  id: UUIDString;
  __typename?: 'Recipe_Key';
}

export interface UpdateRecipeData {
  recipe_update?: Recipe_Key | null;
}

export interface UpdateRecipeVariables {
  id: UUIDString;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ingredients?: string | null;
  instructions?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  operationName: string;
}
export const createCategoryRef: CreateCategoryRef;

export function createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;
export function createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface ListPublicRecipesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicRecipesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicRecipesData, undefined>;
  operationName: string;
}
export const listPublicRecipesRef: ListPublicRecipesRef;

export function listPublicRecipes(): QueryPromise<ListPublicRecipesData, undefined>;
export function listPublicRecipes(dc: DataConnect): QueryPromise<ListPublicRecipesData, undefined>;

interface UpdateRecipeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRecipeVariables): MutationRef<UpdateRecipeData, UpdateRecipeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRecipeVariables): MutationRef<UpdateRecipeData, UpdateRecipeVariables>;
  operationName: string;
}
export const updateRecipeRef: UpdateRecipeRef;

export function updateRecipe(vars: UpdateRecipeVariables): MutationPromise<UpdateRecipeData, UpdateRecipeVariables>;
export function updateRecipe(dc: DataConnect, vars: UpdateRecipeVariables): MutationPromise<UpdateRecipeData, UpdateRecipeVariables>;

interface GetMyCookbooksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyCookbooksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyCookbooksData, undefined>;
  operationName: string;
}
export const getMyCookbooksRef: GetMyCookbooksRef;

export function getMyCookbooks(): QueryPromise<GetMyCookbooksData, undefined>;
export function getMyCookbooks(dc: DataConnect): QueryPromise<GetMyCookbooksData, undefined>;

