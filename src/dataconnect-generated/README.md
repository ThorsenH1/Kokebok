# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPublicRecipes*](#listpublicrecipes)
  - [*GetMyCookbooks*](#getmycookbooks)
- [**Mutations**](#mutations)
  - [*CreateCategory*](#createcategory)
  - [*UpdateRecipe*](#updaterecipe)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPublicRecipes
You can execute the `ListPublicRecipes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPublicRecipes(): QueryPromise<ListPublicRecipesData, undefined>;

interface ListPublicRecipesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicRecipesData, undefined>;
}
export const listPublicRecipesRef: ListPublicRecipesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPublicRecipes(dc: DataConnect): QueryPromise<ListPublicRecipesData, undefined>;

interface ListPublicRecipesRef {
  ...
  (dc: DataConnect): QueryRef<ListPublicRecipesData, undefined>;
}
export const listPublicRecipesRef: ListPublicRecipesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPublicRecipesRef:
```typescript
const name = listPublicRecipesRef.operationName;
console.log(name);
```

### Variables
The `ListPublicRecipes` query has no variables.
### Return Type
Recall that executing the `ListPublicRecipes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPublicRecipesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPublicRecipesData {
  recipes: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
  } & Recipe_Key)[];
}
```
### Using `ListPublicRecipes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPublicRecipes } from '@dataconnect/generated';


// Call the `listPublicRecipes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPublicRecipes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPublicRecipes(dataConnect);

console.log(data.recipes);

// Or, you can use the `Promise` API.
listPublicRecipes().then((response) => {
  const data = response.data;
  console.log(data.recipes);
});
```

### Using `ListPublicRecipes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPublicRecipesRef } from '@dataconnect/generated';


// Call the `listPublicRecipesRef()` function to get a reference to the query.
const ref = listPublicRecipesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPublicRecipesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.recipes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.recipes);
});
```

## GetMyCookbooks
You can execute the `GetMyCookbooks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyCookbooks(): QueryPromise<GetMyCookbooksData, undefined>;

interface GetMyCookbooksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyCookbooksData, undefined>;
}
export const getMyCookbooksRef: GetMyCookbooksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyCookbooks(dc: DataConnect): QueryPromise<GetMyCookbooksData, undefined>;

interface GetMyCookbooksRef {
  ...
  (dc: DataConnect): QueryRef<GetMyCookbooksData, undefined>;
}
export const getMyCookbooksRef: GetMyCookbooksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyCookbooksRef:
```typescript
const name = getMyCookbooksRef.operationName;
console.log(name);
```

### Variables
The `GetMyCookbooks` query has no variables.
### Return Type
Recall that executing the `GetMyCookbooks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyCookbooksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyCookbooksData {
  cookbooks: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    author?: string | null;
    publicationYear?: number | null;
  } & Cookbook_Key)[];
}
```
### Using `GetMyCookbooks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyCookbooks } from '@dataconnect/generated';


// Call the `getMyCookbooks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyCookbooks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyCookbooks(dataConnect);

console.log(data.cookbooks);

// Or, you can use the `Promise` API.
getMyCookbooks().then((response) => {
  const data = response.data;
  console.log(data.cookbooks);
});
```

### Using `GetMyCookbooks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyCookbooksRef } from '@dataconnect/generated';


// Call the `getMyCookbooksRef()` function to get a reference to the query.
const ref = getMyCookbooksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyCookbooksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.cookbooks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.cookbooks);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCategory
You can execute the `CreateCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCategoryRef:
```typescript
const name = createCategoryRef.operationName;
console.log(name);
```

### Variables
The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCategoryVariables {
  name: string;
}
```
### Return Type
Recall that executing the `CreateCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCategoryData {
  category_insert: Category_Key;
}
```
### Using `CreateCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCategory, CreateCategoryVariables } from '@dataconnect/generated';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  name: ..., 
};

// Call the `createCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCategory(createCategoryVars);
// Variables can be defined inline as well.
const { data } = await createCategory({ name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCategory(dataConnect, createCategoryVars);

console.log(data.category_insert);

// Or, you can use the `Promise` API.
createCategory(createCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.category_insert);
});
```

### Using `CreateCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCategoryRef, CreateCategoryVariables } from '@dataconnect/generated';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  name: ..., 
};

// Call the `createCategoryRef()` function to get a reference to the mutation.
const ref = createCategoryRef(createCategoryVars);
// Variables can be defined inline as well.
const ref = createCategoryRef({ name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCategoryRef(dataConnect, createCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_insert);
});
```

## UpdateRecipe
You can execute the `UpdateRecipe` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRecipe(vars: UpdateRecipeVariables): MutationPromise<UpdateRecipeData, UpdateRecipeVariables>;

interface UpdateRecipeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRecipeVariables): MutationRef<UpdateRecipeData, UpdateRecipeVariables>;
}
export const updateRecipeRef: UpdateRecipeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRecipe(dc: DataConnect, vars: UpdateRecipeVariables): MutationPromise<UpdateRecipeData, UpdateRecipeVariables>;

interface UpdateRecipeRef {
  ...
  (dc: DataConnect, vars: UpdateRecipeVariables): MutationRef<UpdateRecipeData, UpdateRecipeVariables>;
}
export const updateRecipeRef: UpdateRecipeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRecipeRef:
```typescript
const name = updateRecipeRef.operationName;
console.log(name);
```

### Variables
The `UpdateRecipe` mutation requires an argument of type `UpdateRecipeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRecipeVariables {
  id: UUIDString;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ingredients?: string | null;
  instructions?: string | null;
}
```
### Return Type
Recall that executing the `UpdateRecipe` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRecipeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRecipeData {
  recipe_update?: Recipe_Key | null;
}
```
### Using `UpdateRecipe`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRecipe, UpdateRecipeVariables } from '@dataconnect/generated';

// The `UpdateRecipe` mutation requires an argument of type `UpdateRecipeVariables`:
const updateRecipeVars: UpdateRecipeVariables = {
  id: ..., 
  title: ..., // optional
  description: ..., // optional
  imageUrl: ..., // optional
  ingredients: ..., // optional
  instructions: ..., // optional
};

// Call the `updateRecipe()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRecipe(updateRecipeVars);
// Variables can be defined inline as well.
const { data } = await updateRecipe({ id: ..., title: ..., description: ..., imageUrl: ..., ingredients: ..., instructions: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRecipe(dataConnect, updateRecipeVars);

console.log(data.recipe_update);

// Or, you can use the `Promise` API.
updateRecipe(updateRecipeVars).then((response) => {
  const data = response.data;
  console.log(data.recipe_update);
});
```

### Using `UpdateRecipe`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRecipeRef, UpdateRecipeVariables } from '@dataconnect/generated';

// The `UpdateRecipe` mutation requires an argument of type `UpdateRecipeVariables`:
const updateRecipeVars: UpdateRecipeVariables = {
  id: ..., 
  title: ..., // optional
  description: ..., // optional
  imageUrl: ..., // optional
  ingredients: ..., // optional
  instructions: ..., // optional
};

// Call the `updateRecipeRef()` function to get a reference to the mutation.
const ref = updateRecipeRef(updateRecipeVars);
// Variables can be defined inline as well.
const ref = updateRecipeRef({ id: ..., title: ..., description: ..., imageUrl: ..., ingredients: ..., instructions: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRecipeRef(dataConnect, updateRecipeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.recipe_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.recipe_update);
});
```

