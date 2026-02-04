# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createCategory, listPublicRecipes, updateRecipe, getMyCookbooks } from '@dataconnect/generated';


// Operation CreateCategory:  For variables, look at type CreateCategoryVars in ../index.d.ts
const { data } = await CreateCategory(dataConnect, createCategoryVars);

// Operation ListPublicRecipes: 
const { data } = await ListPublicRecipes(dataConnect);

// Operation UpdateRecipe:  For variables, look at type UpdateRecipeVars in ../index.d.ts
const { data } = await UpdateRecipe(dataConnect, updateRecipeVars);

// Operation GetMyCookbooks: 
const { data } = await GetMyCookbooks(dataConnect);


```